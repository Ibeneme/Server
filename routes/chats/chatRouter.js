// chatRouter.js

const express = require('express');
const router = express.Router();
const socketIo = require('socket.io');

function initializeChatRouter(server) {
  const io = socketIo(server);

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle chat messages
    socket.on('message', (data) => {
      const { userId, message } = data; // Extract userId and message from data
      console.log(`Message received from User ${userId}:`, message);
      io.emit('message', { userId, message }); // Broadcast message to all connected clients
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return router;
}

module.exports = initializeChatRouter;
