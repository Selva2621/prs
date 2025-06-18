import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isActive: true,
        lastSeen: true,
        createdAt: true,
        // Exclude password from results
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        birthday: true,
        isActive: true,
        lastSeen: true,
        preferences: true,
        profileData: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password from results
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isActive: true,
        // Exclude password from results
      },
    });
  }

  async update(id: string, updateData: Prisma.UserUpdateInput) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          phone: true,
          birthday: true,
          isActive: true,
          lastSeen: true,
          preferences: true,
          profileData: true,
          updatedAt: true,
          // Exclude password from results
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async updateLastSeen(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastSeen: new Date() },
      select: {
        id: true,
        lastSeen: true,
      },
    });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        isActive: true,
      },
    });
  }

  async getUserStats(id: string) {
    const user = await this.findOne(id);
    
    const [messageCount, photoCount, callCount, proposalCount] = await Promise.all([
      this.prisma.message.count({
        where: {
          OR: [
            { senderId: id },
            { recipientId: id },
          ],
        },
      }),
      this.prisma.photo.count({
        where: { uploadedById: id },
      }),
      this.prisma.videoCall.count({
        where: {
          OR: [
            { callerId: id },
            { calleeId: id },
          ],
        },
      }),
      this.prisma.proposal.count({
        where: { proposerId: id },
      }),
    ]);

    return {
      user,
      stats: {
        messages: messageCount,
        photos: photoCount,
        videoCalls: callCount,
        proposals: proposalCount,
      },
    };
  }
}
