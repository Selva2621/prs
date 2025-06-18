const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const port = 3001;

console.log('🚀 Starting simple test server...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Enable CORS
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  console.log('📡 HTTP request received');
  res.json({
    message: 'Simple Test Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true,
  },
  path: '/socket.io/',
});

// Socket.IO namespace for chat
const chatNamespace = io.of('/chat');

// Simple connection tracking
const connectedUsers = new Map();
const activeUsers = new Map();

chatNamespace.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Simple auth
  const userId = socket.handshake.auth?.userId || `user_${Date.now()}`;
  socket.userId = userId;
  connectedUsers.set(userId, socket.id);

  // Track active user
  const userInfo = {
    id: userId,
    fullName: `User ${userId}`,
    email: `${userId}@example.com`,
    avatarUrl: null,
    connectedAt: new Date().toISOString(),
    socketId: socket.id
  };
  activeUsers.set(userId, userInfo);

  console.log(`👤 User ${userId} connected`);

  // Broadcast updated active users list
  chatNamespace.emit('active_users_updated', {
    activeUsers: Array.from(activeUsers.values())
  });

  // Get active users
  socket.on('get_active_users', () => {
    console.log(`📋 Sending active users list to ${userId}`);
    socket.emit('active_users_list', {
      activeUsers: Array.from(activeUsers.values())
    });
  });

  // Send chat invitation
  socket.on('send_chat_invitation', (data) => {
    console.log(`💌 Chat invitation from ${userId}:`, data);
    const { recipientId, message } = data;
    const invitationId = `inv_${Date.now()}_${userId}_${recipientId}`;

    const invitation = {
      id: invitationId,
      senderId: userId,
      recipientId,
      message: message || 'Would you like to chat?',
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      sender: activeUsers.get(userId)
    };

    // Send invitation to recipient
    const recipientSocketId = connectedUsers.get(recipientId);
    if (recipientSocketId) {
      chatNamespace.to(recipientSocketId).emit('chat_invitation_received', invitation);
      socket.emit('chat_invitation_sent', { invitationId, recipientId });
      console.log(`✉️ Invitation sent to ${recipientId}`);
    } else {
      socket.emit('error', { message: 'User is not online' });
      console.log(`❌ User ${recipientId} is not online`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`👋 User ${userId} disconnected: ${reason}`);
    connectedUsers.delete(userId);
    activeUsers.delete(userId);

    // Broadcast updated active users list
    chatNamespace.emit('active_users_updated', {
      activeUsers: Array.from(activeUsers.values())
    });
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

server.listen(port, '0.0.0.0', (error) => {
  if (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
  console.log(`🚀 Simple test server running on http://localhost:${port}`);
  console.log(`🌐 Server accessible on network at http://192.168.86.8:${port}`);
  console.log(`📡 WebSocket endpoint: ws://192.168.86.8:${port}/chat`);
  console.log('✅ Server is ready to accept connections!');
});
