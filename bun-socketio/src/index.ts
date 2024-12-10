import { Server } from "socket.io";
import { createServer } from "http";
import { db } from '@/src/drizzle/db';
import { todos } from '@/src/drizzle/db/schema';
import { eq } from 'drizzle-orm';
import { z } from "zod";
import { verify } from 'jsonwebtoken';

// Enhance token validation
// const validateToken = (token: string): Promise<any> => {
//   return new Promise((resolve, reject) => {
//     verify(token, process.env.JWT_SECRET!, (err, decoded) => {
//       if (err) reject(err);
//       resolve(decoded);
//     });
//   });
// };

// Create an HTTP server
const httpServer = createServer();

// Initialize a Socket.IO server with CORS allowing all origins
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5173"], // Allow all origins
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"], // Add any custom headers if needed
    credentials: true, // Allow credentials if needed
  },
});

// Authentication middleware
// io.use(async (socket, next) => {
//   try {
//     const token = socket.handshake.auth.token;
//     if (!token) {
//       throw new Error('Authentication error');
//     }

//     const decoded = await validateToken(token);
//     socket.data.user = decoded; // Store user data in socket
//     next();
//   } catch (error) {
//     next(new Error('Authentication error'));
//   }
// });

// Zod schema for todo validation
const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  userId: z.string(),
});

// Handle Socket.IO connections and events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  // Join user to their specific room
  socket.on("join", (userId) => {
    console.log("User joining room:", userId);
    socket.join(userId);
  });

  // Fetch todos for a user
  socket.on("fetchTodos", async (userId) => {
    console.log("fetchTodos event received for userId:", userId);
    try {
      const result = await db.select().from(todos).where(eq(todos.userId, userId));
      console.log("Fetched todos:", result);
      // Emit to specific user's socket
      socket.emit("todos", result);
    } catch (error) {
      console.error("Error fetching todos:", error);
      socket.emit("error", { message: "Error fetching todos" });
    }
  });

  // Add a new todo
  socket.on("addTodo", async ({ title, userId }) => {
    console.log("addTodo event received with data:", { title, userId });
    try {
      todoSchema.parse({ title, userId });
      const newTodo = await db.insert(todos).values({ title, userId }).returning();
      console.log("New todo added:", newTodo[0]);
      // Emit to all sockets in the user's room
      io.to(userId).emit("todoAdded", newTodo[0]);
      // Also emit to the sender to confirm
      socket.emit("todoAddedConfirmation", newTodo[0]);
    } catch (error) {
      console.error("Error adding todo:", error);
      socket.emit("error", { message: "Failed to add todo" });
    }
  });

  // Update a todo
  socket.on("updateTodo", async ({ id, completed, userId }) => {
    console.log("updateTodo event received with data:", { id, completed, userId });
    try {
      const updatedTodo = await db
        .update(todos)
        .set({ completed })
        .where(eq(todos.id, id))
        .returning();
      
      if (updatedTodo.length > 0) {
        io.to(userId).emit("todoUpdated", { id, completed });
        socket.emit("todoUpdateConfirmation", { id, completed });
      } else {
        throw new Error("Todo not found");
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      socket.emit("error", { message: "Failed to update todo" });
    }
  });

  // Delete a todo
  socket.on("deleteTodo", async ({ id, userId }) => {
    console.log("deleteTodo event received with data:", { id, userId });
    try {
      const deletedTodo = await db
        .delete(todos)
        .where(eq(todos.id, id))
        .returning();
      
      if (deletedTodo.length > 0) {
        io.to(userId).emit("todoDeleted", id);
        socket.emit("todoDeleteConfirmation", id);
      } else {
        throw new Error("Todo not found");
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      socket.emit("error", { message: "Failed to delete todo" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// Start the HTTP server
httpServer.listen(process.env.PORT, () => {
  console.log("Listening on port", process.env.PORT);
});
