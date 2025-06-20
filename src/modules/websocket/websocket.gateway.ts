import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface JoinRoomData {
  recipientId: string;
}

interface SendMessageData {
  recipientId: string;
  content: string;
  type?: string;
}

interface TypingData {
  recipientId: string;
  isTyping: boolean;
}

interface ChatInvitationData {
  recipientId: string;
  message: string;
}

interface InvitationResponseData {
  invitationId: string;
}

@WSGateway({
  cors: {
    origin: [
      'http://localhost:19006',
      'exp://192.168.1.100:19000',
      'exp://192.168.86.8:8081',
      'http://192.168.86.8:8081',
      'https://prs-c7e1.onrender.com',
      '*'
    ],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger: Logger = new Logger('WebSocketGateway');
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userRooms = new Map<string, Set<string>>(); // userId -> Set of room IDs
  private pendingInvitations = new Map<string, any>(); // invitationId -> invitation data

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) { }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`Client attempting to connect: ${client.id}`);

      // Extract token from handshake auth
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      if (!userId) {
        this.logger.warn(`Client ${client.id} disconnected: Invalid token`);
        client.disconnect();
        return;
      }

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, avatarUrl: true },
      });

      if (!user) {
        this.logger.warn(`Client ${client.id} disconnected: User not found`);
        client.disconnect();
        return;
      }

      // Store user info in socket
      client.userId = userId;
      client.user = user;

      // Track connected user
      this.connectedUsers.set(userId, client.id);
      this.userRooms.set(userId, new Set());

      this.logger.log(`User ${user.fullName} (${userId}) connected with socket ${client.id}`);

      // Notify user is online
      client.broadcast.emit('user_online', { userId, user });

    } catch (error: any) {
      this.logger.error(`Connection error for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`User ${client.userId} disconnected`);

      // Remove from connected users
      this.connectedUsers.delete(client.userId);

      // Clean up user rooms
      this.userRooms.delete(client.userId);

      // Notify user is offline
      client.broadcast.emit('user_offline', { userId: client.userId });
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinRoomData,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { recipientId } = data;

    // Create room ID (consistent ordering for 1-on-1 chat)
    const roomId = [client.userId, recipientId].sort().join('_');

    // Join the room
    await client.join(roomId);

    // Track user's rooms
    const userRooms = this.userRooms.get(client.userId) || new Set();
    userRooms.add(roomId);
    this.userRooms.set(client.userId, userRooms);

    this.logger.log(`User ${client.userId} joined room ${roomId}`);

    // Notify room joined
    client.emit('room_joined', { roomId, recipientId });

    // Also notify the recipient if they're online and auto-join them to the room
    const recipientSocketId = this.connectedUsers.get(recipientId);
    if (recipientSocketId) {
      // Notify the recipient that someone joined
      this.server.to(recipientSocketId).emit('user_joined_room', {
        userId: client.userId,
        user: client.user,
        roomId,
      });

      // Auto-join the recipient to the room
      const recipientSocket = this.server.sockets.sockets.get(recipientSocketId);
      if (recipientSocket) {
        await recipientSocket.join(roomId);

        // Track recipient's rooms
        const recipientRooms = this.userRooms.get(recipientId) || new Set();
        recipientRooms.add(roomId);
        this.userRooms.set(recipientId, recipientRooms);

        this.logger.log(`User ${recipientId} auto-joined room ${roomId}`);

        // Notify recipient they joined the room
        this.server.to(recipientSocketId).emit('room_joined', { roomId, recipientId: client.userId });
      }
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinRoomData,
  ) {
    if (!client.userId) return;

    const { recipientId } = data;
    const roomId = [client.userId, recipientId].sort().join('_');

    await client.leave(roomId);

    // Remove from user's rooms
    const userRooms = this.userRooms.get(client.userId);
    if (userRooms) {
      userRooms.delete(roomId);
    }

    this.logger.log(`User ${client.userId} left room ${roomId}`);
    client.emit('room_left', { roomId, recipientId });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageData,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const { recipientId, content, type = 'TEXT' } = data;

      // Create message in database
      const message = await this.prisma.message.create({
        data: {
          content,
          type: type as any,
          senderId: client.userId,
          recipientId,
          status: 'SENT',
          metadata: {},
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          recipient: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      const roomId = [client.userId, recipientId].sort().join('_');

      // Emit to room (both sender and recipient if online)
      this.server.to(roomId).emit('new_message', message);

      // Also emit to recipient directly if they're online (ensures delivery even if not in room)
      const recipientSocketId = this.connectedUsers.get(recipientId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('new_message', message);
        this.logger.log(`Message also sent directly to recipient ${recipientId}`);
      }

      // Emit back to sender for confirmation (excluding them from room broadcast)
      client.emit('new_message', message);

      this.logger.log(`Message sent from ${client.userId} to ${recipientId} in room ${roomId}`);

    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingData,
  ) {
    if (!client.userId) return;

    const { recipientId, isTyping } = data;
    const roomId = [client.userId, recipientId].sort().join('_');

    // Emit typing status to room (excluding sender)
    client.to(roomId).emit('user_typing', {
      userId: client.userId,
      user: client.user,
      isTyping,
    });

    // Also emit directly to recipient if online
    const recipientSocketId = this.connectedUsers.get(recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('user_typing', {
        userId: client.userId,
        user: client.user,
        isTyping,
      });
    }
  }

  @SubscribeMessage('mark_message_read')
  async handleMarkMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    if (!client.userId) return;

    try {
      const { messageId } = data;

      // Update message status in database
      const message = await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          recipient: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      const roomId = [message.senderId, message.recipientId].sort().join('_');

      // Notify room about read status
      this.server.to(roomId).emit('message_read', {
        messageId,
        readBy: client.userId,
        readAt: message.readAt,
      });

      // Also notify sender directly if online
      const senderSocketId = this.connectedUsers.get(message.senderId);
      if (senderSocketId && message.senderId !== client.userId) {
        this.server.to(senderSocketId).emit('message_read', {
          messageId,
          readBy: client.userId,
          readAt: message.readAt,
        });
      }

    } catch (error) {
      this.logger.error('Error marking message as read:', error);
      client.emit('error', { message: 'Failed to mark message as read' });
    }
  }

  // Helper method to emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Helper method to get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  @SubscribeMessage('get_active_users')
  async handleGetActiveUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // Get all connected users with their details
      const activeUserIds = Array.from(this.connectedUsers.keys());

      if (activeUserIds.length === 0) {
        client.emit('active_users_list', { activeUsers: [] });
        return;
      }

      // Fetch user details from database
      const activeUsers = await this.prisma.user.findMany({
        where: {
          id: { in: activeUserIds },
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          lastSeen: true,
        },
      });

      // Add connection info
      const activeUsersWithConnection = activeUsers.map(user => ({
        ...user,
        socketId: this.connectedUsers.get(user.id),
        connectedAt: new Date().toISOString(),
      }));

      this.logger.log(`Sending active users list to ${client.userId}: ${activeUsersWithConnection.length} users`);
      client.emit('active_users_list', { activeUsers: activeUsersWithConnection });

    } catch (error) {
      this.logger.error('Error getting active users:', error);
      client.emit('error', { message: 'Failed to get active users' });
    }
  }

  @SubscribeMessage('send_chat_invitation')
  async handleSendChatInvitation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: ChatInvitationData,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const { recipientId, message } = data;

      // Check if recipient is online
      const recipientSocketId = this.connectedUsers.get(recipientId);
      if (!recipientSocketId) {
        client.emit('error', { message: 'User is not online' });
        return;
      }

      // Generate invitation ID
      const invitationId = `inv_${Date.now()}_${client.userId}_${recipientId}`;

      // Create invitation object
      const invitation = {
        id: invitationId,
        senderId: client.userId,
        recipientId,
        message: message || 'Would you like to chat?',
        createdAt: new Date().toISOString(),
        status: 'PENDING',
        sender: client.user,
      };

      // Store invitation
      this.pendingInvitations.set(invitationId, invitation);

      // Send invitation to recipient
      this.server.to(recipientSocketId).emit('chat_invitation_received', invitation);

      // Confirm to sender
      client.emit('chat_invitation_sent', { invitationId, recipientId });

      this.logger.log(`Chat invitation sent from ${client.userId} to ${recipientId}`);

    } catch (error) {
      this.logger.error('Error sending chat invitation:', error);
      client.emit('error', { message: 'Failed to send chat invitation' });
    }
  }

  @SubscribeMessage('accept_chat_invitation')
  async handleAcceptChatInvitation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: InvitationResponseData,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const { invitationId } = data;
      const invitation = this.pendingInvitations.get(invitationId);

      if (!invitation || invitation.recipientId !== client.userId) {
        client.emit('error', { message: 'Invalid invitation' });
        return;
      }

      // Update invitation status
      invitation.status = 'ACCEPTED';
      invitation.acceptedAt = new Date().toISOString();

      // Create room for both users
      const roomId = [invitation.senderId, invitation.recipientId].sort().join('_');

      // Join both users to the room
      await client.join(roomId);
      const senderSocketId = this.connectedUsers.get(invitation.senderId);
      if (senderSocketId) {
        const senderSocket = this.server.sockets.sockets.get(senderSocketId);
        if (senderSocket) {
          await senderSocket.join(roomId);
        }
      }

      // Update user rooms tracking
      const recipientRooms = this.userRooms.get(client.userId) || new Set();
      recipientRooms.add(roomId);
      this.userRooms.set(client.userId, recipientRooms);

      const senderRooms = this.userRooms.get(invitation.senderId) || new Set();
      senderRooms.add(roomId);
      this.userRooms.set(invitation.senderId, senderRooms);

      // Notify both users
      client.emit('chat_invitation_accepted', { invitationId, roomId });
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('chat_invitation_accepted', { invitationId, roomId });
      }

      // Remove from pending invitations
      this.pendingInvitations.delete(invitationId);

      this.logger.log(`Chat invitation ${invitationId} accepted, room ${roomId} created`);

    } catch (error) {
      this.logger.error('Error accepting chat invitation:', error);
      client.emit('error', { message: 'Failed to accept chat invitation' });
    }
  }

  @SubscribeMessage('reject_chat_invitation')
  async handleRejectChatInvitation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: InvitationResponseData,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const { invitationId } = data;
      const invitation = this.pendingInvitations.get(invitationId);

      if (!invitation || invitation.recipientId !== client.userId) {
        client.emit('error', { message: 'Invalid invitation' });
        return;
      }

      // Update invitation status
      invitation.status = 'REJECTED';
      invitation.rejectedAt = new Date().toISOString();

      // Notify sender
      const senderSocketId = this.connectedUsers.get(invitation.senderId);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('chat_invitation_rejected', { invitationId });
      }

      // Notify recipient
      client.emit('chat_invitation_rejected', { invitationId });

      // Remove from pending invitations
      this.pendingInvitations.delete(invitationId);

      this.logger.log(`Chat invitation ${invitationId} rejected`);

    } catch (error) {
      this.logger.error('Error rejecting chat invitation:', error);
      client.emit('error', { message: 'Failed to reject chat invitation' });
    }
  }
}
