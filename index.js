require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/utils/db');
const matchmakingController = require('./src/controllers/matchmaking.controller');
const { processMatchmakingQueue } = require('./src/services/matchmaking.service');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Connect to MongoDB
connectDB();

app.use(express.json());

app.post('/matchmaking/join', matchmakingController.joinMatchmaking);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Store the user's ID when they connect
  socket.on('register', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

setInterval(() => {
  processMatchmakingQueue(io);
}, 5000); // Process the queue every 5 seconds

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
