import { Hono } from 'hono'
import { Server } from "socket.io";
import { createServer } from "http";
import { z } from "zod";
import { db } from '@/src/drizzle/db';
import { todos } from '@/src/drizzle/db/schema';
import { eq } from 'drizzle-orm';


const app = new Hono()



// Create a server with the Hono app
const server = createServer(app.fetch);

// Allow CORS for the SvelteKit frontend
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(async (c, next) => {
  c.set('io', io)
  await next()
})

// Hono API routes
app.get("/", (c) => {
  console.log('GET / request received');
  return c.text("Todo app backend is running!");
});





// Zod schema for todo validation
const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  userId: z.string(),
});

// Socket.IO logic
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

// Start the server
const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


export default {
    port: PORT,
    fetch: app.fetch,
}