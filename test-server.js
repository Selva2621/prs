const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const port = 3001;

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:19006',
      'exp://192.168.1.100:19000',
      'exp://192.168.86.8:8081',
      'http://192.168.86.8:8081',
      '*'
    ],
    credentials: true,
  },
  path: '/socket.io/',
});

// Socket.IO namespace for chat
const chatNamespace = io.of('/chat');

// Enable CORS
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  res.json({ message: 'Cosmic Love API Test Server is running!' });
});

app.get('/users', (req, res) => {
  res.json([
    {
      id: '1',
      fullName: 'Test User 1',
      email: 'test1@example.com',
      avatarUrl: null
    },
    {
      id: '2',
      fullName: 'Test User 2',
      email: 'test2@example.com',
      avatarUrl: null
    }
  ]);
});

app.get('/messages', (req, res) => {
  res.json([
    {
      id: '1',
      content: 'Hello, my love! 💖',
      senderId: '1',
      recipientId: '2',
      createdAt: new Date().toISOString(),
      sender: {
        id: '1',
        fullName: 'Test User 1',
        email: 'test1@example.com',
        avatarUrl: null
      },
      recipient: {
        id: '2',
        fullName: 'Test User 2',
        email: 'test2@example.com',
        avatarUrl: null
      },
      type: 'TEXT',
      status: 'SENT'
    }
  ]);
});

app.post('/messages', (req, res) => {
  const { recipientId, content, type } = req.body;
  res.json({
    id: Date.now().toString(),
    content,
    senderId: '1',
    recipientId,
    createdAt: new Date().toISOString(),
    sender: {
      id: '1',
      fullName: 'Test User 1',
      email: 'test1@example.com',
      avatarUrl: null
    },
    recipient: {
      id: recipientId,
      fullName: 'Test User 2',
      email: 'test2@example.com',
      avatarUrl: null
    },
    type: type || 'TEXT',
    status: 'SENT'
  });
});

// Socket.IO connection handling
const connectedUsers = new Map(); // userId -> socketId
const userRooms = new Map(); // userId -> Set of room IDs
const activeUsers = new Map(); // userId -> user info
const pendingInvitations = new Map(); // invitationId -> invitation data

chatNamespace.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Simple auth - in real app, verify JWT token
  const userId = socket.handshake.auth?.userId || `user_${Date.now()}`;
  socket.userId = userId;
  connectedUsers.set(userId, socket.id);
  userRooms.set(userId, new Set());

  // Track active user info
  const userInfo = {
    id: userId,
    fullName: `User ${userId}`,
    email: `${userId}@example.com`,
    avatarUrl: null,
    connectedAt: new Date().toISOString(),
    socketId: socket.id
  };
  activeUsers.set(userId, userInfo);

  console.log(`User ${userId} connected with socket ${socket.id}`);

  // Broadcast updated active users list to all clients
  chatNamespace.emit('active_users_updated', {
    activeUsers: Array.from(activeUsers.values())
  });

  // Join room event
  socket.on('join_room', (data) => {
    const { recipientId } = data;
    const roomId = [userId, recipientId].sort().join('_');

    socket.join(roomId);
    const userRoomSet = userRooms.get(userId) || new Set();
    userRoomSet.add(roomId);
    userRooms.set(userId, userRoomSet);

    console.log(`User ${userId} joined room ${roomId}`);
    socket.emit('room_joined', { roomId, recipientId });
  });

  // Leave room event
  socket.on('leave_room', (data) => {
    const { recipientId } = data;
    const roomId = [userId, recipientId].sort().join('_');

    socket.leave(roomId);
    const userRoomSet = userRooms.get(userId);
    if (userRoomSet) {
      userRoomSet.delete(roomId);
    }

    console.log(`User ${userId} left room ${roomId}`);
    socket.emit('room_left', { roomId, recipientId });
  });

  // Send message event
  socket.on('send_message', (data) => {
    const { recipientId, content, type = 'TEXT' } = data;

    const message = {
      id: Date.now().toString(),
      content,
      senderId: userId,
      recipientId,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        fullName: `User ${userId}`,
        email: `${userId}@example.com`,
        avatarUrl: null
      },
      recipient: {
        id: recipientId,
        fullName: `User ${recipientId}`,
        email: `${recipientId}@example.com`,
        avatarUrl: null
      },
      type,
      status: 'SENT'
    };

    const roomId = [userId, recipientId].sort().join('_');

    // Emit to room
    chatNamespace.to(roomId).emit('new_message', message);

    // Also emit to recipient directly if online
    const recipientSocketId = connectedUsers.get(recipientId);
    if (recipientSocketId) {
      chatNamespace.to(recipientSocketId).emit('new_message', message);
    }

    console.log(`Message sent from ${userId} to ${recipientId} in room ${roomId}`);
  });

  // Typing event
  socket.on('typing', (data) => {
    const { recipientId, isTyping } = data;
    const roomId = [userId, recipientId].sort().join('_');

    // Emit to room (excluding sender)
    socket.to(roomId).emit('user_typing', {
      userId,
      user: { id: userId, fullName: `User ${userId}` },
      isTyping,
    });

    // Also emit to recipient directly
    const recipientSocketId = connectedUsers.get(recipientId);
    if (recipientSocketId) {
      chatNamespace.to(recipientSocketId).emit('user_typing', {
        userId,
        user: { id: userId, fullName: `User ${userId}` },
        isTyping,
      });
    }
  });

  // Mark message as read
  socket.on('mark_message_read', (data) => {
    const { messageId } = data;

    // In a real app, update database here
    const readEvent = {
      messageId,
      readBy: userId,
      readAt: new Date().toISOString(),
    };

    // Emit to all connected clients (simplified)
    chatNamespace.emit('message_read', readEvent);

    console.log(`Message ${messageId} marked as read by ${userId}`);
  });

  // Get active users
  socket.on('get_active_users', () => {
    socket.emit('active_users_list', {
      activeUsers: Array.from(activeUsers.values())
    });
  });

  // Send chat invitation
  socket.on('send_chat_invitation', (data) => {
    const { recipientId, message } = data;
    const invitationId = `inv_${Date.now()}_${userId}_${recipientId}`;

    const invitation = {
      id: invitationId,
      senderId: userId,
      recipientId,
      message: message || 'Would you like to chat?',
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      sender: activeUsers.get(userId) || {
        id: userId,
        fullName: `User ${userId}`,
        email: `${userId}@example.com`
      }
    };

    pendingInvitations.set(invitationId, invitation);

    // Send invitation to recipient
    const recipientSocketId = connectedUsers.get(recipientId);
    if (recipientSocketId) {
      chatNamespace.to(recipientSocketId).emit('chat_invitation_received', invitation);
      console.log(`Chat invitation sent from ${userId} to ${recipientId}`);

      // Confirm to sender
      socket.emit('chat_invitation_sent', { invitationId, recipientId });
    } else {
      socket.emit('error', { message: 'User is not online' });
    }
  });

  // Accept chat invitation
  socket.on('accept_chat_invitation', (data) => {
    const { invitationId } = data;
    const invitation = pendingInvitations.get(invitationId);

    if (!invitation || invitation.recipientId !== userId) {
      socket.emit('error', { message: 'Invalid invitation' });
      return;
    }

    // Update invitation status
    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = new Date().toISOString();

    // Create room for both users
    const roomId = [invitation.senderId, invitation.recipientId].sort().join('_');

    // Join both users to the room
    socket.join(roomId);
    const senderSocketId = connectedUsers.get(invitation.senderId);
    if (senderSocketId) {
      chatNamespace.sockets.get(senderSocketId)?.join(roomId);
    }

    // Notify both users
    chatNamespace.to(roomId).emit('chat_invitation_accepted', {
      invitation,
      roomId,
      participants: [
        activeUsers.get(invitation.senderId),
        activeUsers.get(invitation.recipientId)
      ]
    });

    // Remove from pending
    pendingInvitations.delete(invitationId);

    console.log(`Chat invitation ${invitationId} accepted, room ${roomId} created`);
  });

  // Reject chat invitation
  socket.on('reject_chat_invitation', (data) => {
    const { invitationId } = data;
    const invitation = pendingInvitations.get(invitationId);

    if (!invitation || invitation.recipientId !== userId) {
      socket.emit('error', { message: 'Invalid invitation' });
      return;
    }

    // Update invitation status
    invitation.status = 'REJECTED';
    invitation.rejectedAt = new Date().toISOString();

    // Notify sender
    const senderSocketId = connectedUsers.get(invitation.senderId);
    if (senderSocketId) {
      chatNamespace.to(senderSocketId).emit('chat_invitation_rejected', invitation);
    }

    // Remove from pending
    pendingInvitations.delete(invitationId);

    console.log(`Chat invitation ${invitationId} rejected`);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`User ${userId} disconnected: ${reason}`);
    connectedUsers.delete(userId);
    userRooms.delete(userId);
    activeUsers.delete(userId);

    // Notify others user is offline
    socket.broadcast.emit('user_offline', { userId });

    // Broadcast updated active users list
    chatNamespace.emit('active_users_updated', {
      activeUsers: Array.from(activeUsers.values())
    });
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

server.listen(port, '0.0.0.0', (error) => {
  if (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
  console.log(`🚀 Test server with Socket.IO running on http://localhost:${port}`);
  console.log(`🌐 Server accessible on network at http://192.168.86.8:${port}`);
  console.log(`📡 WebSocket endpoint: ws://192.168.86.8:${port}/chat`);
  console.log('✅ Server is ready to accept connections!');
});
