import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const messages = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send existing message history to the newly connected client
  socket.emit('message history', messages);

  // Listen for new chat messages
  socket.on('chat message', (msg) => {
    const message = { id: Date.now(), text: msg, sender: 'user' };
    messages.push(message);

    // Broadcast to all clients including sender
    io.emit('chat message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
