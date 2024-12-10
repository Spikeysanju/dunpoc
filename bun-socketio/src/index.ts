import { Server } from "socket.io";
import { createServer } from "http";
import { db } from '@/src/drizzle/db';
import { todos } from '@/src/drizzle/db/schema';
import { eq } from 'drizzle-orm';
import { z } from "zod";
import { validateSessionToken } from '@/src/lib/server/auth';

// Create an HTTP server
const httpServer = createServer();

// Initialize a Socket.IO server with CORS allowing all origins
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://dunpoc.vercel.app"], // Allow all origins
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"], // Add any custom headers if needed
    credentials: true, // Allow credentials if needed
  },
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const sessionToken = socket.handshake.auth.sessionToken;
    if (!sessionToken) {
      throw new Error('No session token provided');
    }

    const { user, session } = await validateSessionToken(sessionToken);
    
    if (!user || !session) {
      throw new Error('Invalid session');
    }

    // Store user data in socket for later use
    socket.data.user = user;
    socket.data.session = session;
    
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Zod schema for todo validation
const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  userId: z.string(),
});

// Handle Socket.IO connections and events
io.on("connection", (socket) => {
  const user = socket.data.user;
  console.log("User connected:", socket.id, "userId:", user.id);
  
  // Auto-join user to their room
  socket.join(user.id);

  // Fetch todos for a user
  socket.on("fetchTodos", async () => {
    try {
      const result = await db.select().from(todos).where(eq(todos.userId, socket.data.user.id));
      socket.emit("todos", result);
    } catch (error) {
      socket.emit("error", { message: "Error fetching todos" });
    }
  });

  // Add a new todo
  socket.on("addTodo", async ({ title }) => {
    try {
      const userId = socket.data.user.id;
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
  socket.on("updateTodo", async ({ id, completed }) => {
    console.log("updateTodo event received with data:", { id, completed });
    try {
      const updatedTodo = await db
        .update(todos)
        .set({ completed })
        .where(eq(todos.id, id))
        .returning();
      
      if (updatedTodo.length > 0) {
        io.to(socket.data.user.id).emit("todoUpdated", { id, completed });
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
  socket.on("deleteTodo", async ({ id }) => {
    console.log("deleteTodo event received with data:", { id });
    try {
      const deletedTodo = await db
        .delete(todos)
        .where(eq(todos.id, id))
        .returning();
      
      if (deletedTodo.length > 0) {
        io.to(socket.data.user.id).emit("todoDeleted", id);
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
