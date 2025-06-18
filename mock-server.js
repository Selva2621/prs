const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const port = 3002;

// Enable CORS
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Mock server running', status: 'ok' });
});

// Setup Socket.IO with minimal configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Chat namespace
const chatNamespace = io.of('/chat');

// Simple in-memory storage
const users = new Map();
const messages = [];

chatNamespace.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Mock user data
  const userId = socket.handshake.auth?.userId || `user_${socket.id.slice(0, 6)}`;
  const user = {
    id: userId,
    fullName: `Test User ${userId}`,
    email: `${userId}@test.com`,
    socketId: socket.id,
    connectedAt: new Date().toISOString()
  };

  users.set(userId, user);
  socket.userId = userId;

  console.log(`User ${userId} connected`);

  // Send active users list immediately
  socket.emit('active_users_list', {
    activeUsers: Array.from(users.values())
  });

  // Broadcast user online
  socket.broadcast.emit('user_online', { userId, user });

  // Handle get active users
  socket.on('get_active_users', () => {
    console.log('Sending active users to', userId);
    socket.emit('active_users_list', {
      activeUsers: Array.from(users.values())
    });
  });

  // Handle chat invitation
  socket.on('send_chat_invitation', (data) => {
    console.log('Chat invitation:', data);
    const { recipientId, message } = data;

    const invitation = {
      id: `inv_${Date.now()}`,
      senderId: userId,
      recipientId,
      message,
      createdAt: new Date().toISOString(),
      sender: users.get(userId)
    };

    // Find recipient socket
    const recipient = Array.from(users.values()).find(u => u.id === recipientId);
    if (recipient) {
      chatNamespace.to(recipient.socketId).emit('chat_invitation_received', invitation);
      socket.emit('chat_invitation_sent', { invitationId: invitation.id });
    } else {
      socket.emit('error', { message: 'User not found' });
    }
  });

  // Handle accept invitation
  socket.on('accept_chat_invitation', (data) => {
    console.log('Invitation accepted:', data);
    socket.emit('chat_invitation_accepted', {
      invitationId: data.invitationId,
      roomId: `room_${userId}_${Date.now()}`
    });
  });

  // Handle reject invitation
  socket.on('reject_chat_invitation', (data) => {
    console.log('Invitation rejected:', data);
    socket.emit('chat_invitation_rejected', { invitationId: data.invitationId });
  });

  // Handle join room
  socket.on('join_room', (data) => {
    const { recipientId } = data;
    const roomId = [userId, recipientId].sort().join('_');
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    socket.emit('room_joined', { roomId, recipientId });
  });

  // Handle leave room
  socket.on('leave_room', (data) => {
    const { recipientId } = data;
    const roomId = [userId, recipientId].sort().join('_');
    socket.leave(roomId);
    console.log(`User ${userId} left room ${roomId}`);
    socket.emit('room_left', { roomId, recipientId });
  });

  // Handle messages
  socket.on('send_message', (data) => {
    console.log('Message sent:', data);
    const message = {
      id: `msg_${Date.now()}`,
      ...data,
      senderId: userId,
      createdAt: new Date().toISOString(),
      sender: users.get(userId),
      status: 'SENT'
    };

    messages.push(message);

    // Send to room
    const roomId = [userId, data.recipientId].sort().join('_');
    chatNamespace.to(roomId).emit('new_message', message);

    // Send to recipient directly if online
    const recipient = Array.from(users.values()).find(u => u.id === data.recipientId);
    if (recipient) {
      chatNamespace.to(recipient.socketId).emit('new_message', message);
    }

    // Confirm to sender
    socket.emit('message_sent', message);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { recipientId, isTyping } = data;
    const recipient = Array.from(users.values()).find(u => u.id === recipientId);
    if (recipient) {
      chatNamespace.to(recipient.socketId).emit('user_typing', {
        userId,
        user: users.get(userId),
        isTyping
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
    users.delete(userId);
    socket.broadcast.emit('user_offline', { userId });
  });
});

server.listen(port, () => {
  console.log(`🚀 Mock server running on port ${port}`);
  console.log(`📡 WebSocket: http://localhost:${port}/chat`);
});
