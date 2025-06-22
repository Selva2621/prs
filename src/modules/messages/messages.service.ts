import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageType, MessageStatus } from '@prisma/client';
import { ChatGateway } from '../websocket/websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
    private notificationsService: NotificationsService,
  ) { }

  async create(createMessageDto: CreateMessageDto, senderId: string) {
    const message = await this.prisma.message.create({
      data: {
        content: createMessageDto.content,
        type: createMessageDto.type || MessageType.TEXT,
        senderId,
        recipientId: createMessageDto.recipientId,
        status: MessageStatus.SENT,
        metadata: createMessageDto.metadata || {},
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

    // Emit WebSocket event for real-time messaging
    try {
      const roomId = [senderId, createMessageDto.recipientId].sort().join('_');
      this.chatGateway.server.to(roomId).emit('new_message', message);

      // Also emit to recipient directly if they're online
      this.chatGateway.emitToUser(createMessageDto.recipientId, 'new_message', message);
    } catch (error) {
      console.error('Failed to emit WebSocket event:', error);
    }

    // Send push notification to recipient
    try {
      await this.notificationsService.sendMessageNotification(
        createMessageDto.recipientId,
        message.sender.fullName || message.sender.email,
        message.content,
        message.id,
      );
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }

    return message;
  }

  async findAll(userId: string, recipientId?: string) {
    const where: any = {
      OR: [
        { senderId: userId },
        { recipientId: userId },
      ],
    };

    if (recipientId) {
      where.AND = [
        {
          OR: [
            { senderId: userId, recipientId },
            { senderId: recipientId, recipientId: userId },
          ],
        },
      ];
    }

    const messages = await this.prisma.message.findMany({
      where,
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages;
  }

  async getConversations(userId: string) {
    // Get all unique conversation partners
    const conversations = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            lastSeen: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            lastSeen: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by conversation partner and get latest message
    const conversationMap = new Map();

    conversations.forEach((message) => {
      const partnerId = message.senderId === userId ? message.recipientId : message.senderId;
      const partner = message.senderId === userId ? message.recipient : message.sender;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partner,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages
      if (message.recipientId === userId && message.status !== MessageStatus.READ) {
        conversationMap.get(partnerId).unreadCount++;
      }
    });

    return Array.from(conversationMap.values());
  }

  async findOne(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
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

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Check if user is involved in this message
    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return message;
  }

  async update(id: string, updateMessageDto: UpdateMessageDto, userId: string) {
    const message = await this.findOne(id, userId);

    // Only sender can update message content
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only update your own messages');
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id },
      data: {
        content: updateMessageDto.content,
        editedAt: new Date(),
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

    return updatedMessage;
  }

  async markAsRead(id: string, userId: string) {
    const message = await this.findOne(id, userId);

    // Only recipient can mark message as read
    if (message.recipientId !== userId) {
      throw new ForbiddenException('You can only mark messages sent to you as read');
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id },
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });

    // Emit WebSocket event for read status
    try {
      const roomId = [message.senderId, message.recipientId].sort().join('_');
      this.chatGateway.server.to(roomId).emit('message_read', {
        messageId: id,
        readBy: userId,
        readAt: updatedMessage.readAt,
      });

      // Also notify sender directly if online
      this.chatGateway.emitToUser(message.senderId, 'message_read', {
        messageId: id,
        readBy: userId,
        readAt: updatedMessage.readAt,
      });
    } catch (error) {
      console.error('Failed to emit WebSocket event:', error);
    }

    return updatedMessage;
  }

  async remove(id: string, userId: string) {
    const message = await this.findOne(id, userId);

    // Only sender can delete message
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.delete({
      where: { id },
    });

    return { message: 'Message deleted successfully' };
  }
}
