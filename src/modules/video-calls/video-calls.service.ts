import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateVideoCallDto } from './dto/create-video-call.dto';
import { UpdateVideoCallDto } from './dto/update-video-call.dto';
import { CallStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VideoCallsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  async create(createVideoCallDto: CreateVideoCallDto, callerId: string) {
    // Check if callee exists
    const callee = await this.prisma.user.findUnique({
      where: { id: createVideoCallDto.calleeId },
    });

    if (!callee) {
      throw new NotFoundException('Callee not found');
    }

    // Check if there's already an active call between these users
    const existingCall = await this.prisma.videoCall.findFirst({
      where: {
        OR: [
          {
            callerId,
            calleeId: createVideoCallDto.calleeId,
            status: { in: [CallStatus.INITIATED, CallStatus.RINGING, CallStatus.CONNECTED] },
          },
          {
            callerId: createVideoCallDto.calleeId,
            calleeId: callerId,
            status: { in: [CallStatus.INITIATED, CallStatus.RINGING, CallStatus.CONNECTED] },
          },
        ],
      },
    });

    if (existingCall) {
      throw new Error('There is already an active call between these users');
    }

    const videoCall = await this.prisma.videoCall.create({
      data: {
        callerId,
        calleeId: createVideoCallDto.calleeId,
        status: CallStatus.INITIATED,
        metadata: createVideoCallDto.metadata || {},
      },
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        callee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Send push notification to callee with ringtone support
    try {
      await this.notificationsService.sendVideoCallNotification(
        createVideoCallDto.calleeId,
        videoCall.caller.fullName || videoCall.caller.email,
        videoCall.id,
      );
    } catch (error) {
      console.error('Failed to send video call notification:', error);
    }

    return videoCall;
  }

  async findAll(userId: string, status?: string) {
    const where: any = {
      OR: [
        { callerId: userId },
        { calleeId: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    const videoCalls = await this.prisma.videoCall.findMany({
      where,
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        callee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return videoCalls;
  }

  async findActive(userId: string) {
    const activeCalls = await this.prisma.videoCall.findMany({
      where: {
        OR: [
          { callerId: userId },
          { calleeId: userId },
        ],
        status: { in: [CallStatus.INITIATED, CallStatus.RINGING, CallStatus.CONNECTED] },
      },
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        callee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return activeCalls;
  }

  async findOne(id: string, userId: string) {
    const videoCall = await this.prisma.videoCall.findUnique({
      where: { id },
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        callee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!videoCall) {
      throw new NotFoundException(`Video call with ID ${id} not found`);
    }

    // Check if user is involved in this call
    if (videoCall.callerId !== userId && videoCall.calleeId !== userId) {
      throw new ForbiddenException('You do not have access to this video call');
    }

    return videoCall;
  }

  async answerCall(id: string, userId: string) {
    const videoCall = await this.findOne(id, userId);

    // Only callee can answer the call
    if (videoCall.calleeId !== userId) {
      throw new ForbiddenException('Only the callee can answer the call');
    }

    // Call must be in INITIATED or RINGING status
    if (videoCall.status !== 'INITIATED' && videoCall.status !== 'RINGING') {
      throw new Error('Call cannot be answered in its current status');
    }

    const updatedCall = await this.prisma.videoCall.update({
      where: { id },
      data: {
        status: CallStatus.CONNECTED,
        startedAt: new Date(),
      },
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        callee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Send push notification to caller that call was accepted
    try {
      await this.notificationsService.sendCallAcceptedNotification(
        videoCall.callerId,
        updatedCall.callee.fullName || updatedCall.callee.email,
        videoCall.id,
      );
    } catch (error) {
      console.error('Failed to send call accepted notification:', error);
    }

    return updatedCall;
  }

  async declineCall(id: string, userId: string) {
    const videoCall = await this.findOne(id, userId);

    // Only callee can decline the call
    if (videoCall.calleeId !== userId) {
      throw new ForbiddenException('Only the callee can decline the call');
    }

    // Call must be in INITIATED or RINGING status
    if (videoCall.status !== 'INITIATED' && videoCall.status !== 'RINGING') {
      throw new Error('Call cannot be declined in its current status');
    }

    const updatedCall = await this.prisma.videoCall.update({
      where: { id },
      data: {
        status: CallStatus.DECLINED,
        endedAt: new Date(),
      },
    });

    // Send push notification to caller that call was declined
    try {
      await this.notificationsService.sendCallDeclinedNotification(
        videoCall.callerId,
        videoCall.callee.fullName || videoCall.callee.email,
        videoCall.id,
      );
    } catch (error) {
      console.error('Failed to send call declined notification:', error);
    }

    return updatedCall;
  }

  async endCall(id: string, userId: string) {
    const videoCall = await this.findOne(id, userId);

    // Both caller and callee can end the call
    if (videoCall.callerId !== userId && videoCall.calleeId !== userId) {
      throw new ForbiddenException('You do not have permission to end this call');
    }

    // Calculate duration if call was connected
    let duration: number | null = null;
    if (videoCall.startedAt) {
      duration = Math.floor((new Date().getTime() - videoCall.startedAt.getTime()) / 1000);
    }

    const updatedCall = await this.prisma.videoCall.update({
      where: { id },
      data: {
        status: CallStatus.ENDED,
        endedAt: new Date(),
        duration,
      },
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        callee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedCall;
  }

  async update(id: string, updateVideoCallDto: UpdateVideoCallDto, userId: string) {
    const videoCall = await this.findOne(id, userId);

    const updatedCall = await this.prisma.videoCall.update({
      where: { id },
      data: {
        metadata: updateVideoCallDto.metadata ? {
          ...(videoCall.metadata as object || {}),
          ...updateVideoCallDto.metadata,
        } : videoCall.metadata,
      },
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        callee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedCall;
  }

  async remove(id: string, userId: string) {
    const videoCall = await this.findOne(id, userId);

    // Only participants can delete the call record
    if (videoCall.callerId !== userId && videoCall.calleeId !== userId) {
      throw new ForbiddenException('You can only delete your own call records');
    }

    await this.prisma.videoCall.delete({
      where: { id },
    });

    return { message: 'Video call record deleted successfully' };
  }
}
