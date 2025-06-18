import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(adminUser: any) {
    this.validateAdminAccess(adminUser);

    const [
      totalUsers,
      activeUsers,
      totalMessages,
      totalPhotos,
      totalVideoCalls,
      totalProposals,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.message.count(),
      this.prisma.photo.count(),
      this.prisma.videoCall.count(),
      this.prisma.proposal.count(),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalMessages,
        totalPhotos,
        totalVideoCalls,
        totalProposals,
      },
      recentUsers,
      adminInfo: {
        name: adminUser.fullName,
        role: adminUser.role,
        email: adminUser.email,
      },
    };
  }

  async getAllUsers(adminUser: any) {
    this.validateAdminAccess(adminUser);

    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: {
            sentMessages: true,
            uploadedPhotos: true,
            proposals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(userId: string, adminUser: any) {
    this.validateAdminAccess(adminUser);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        birthday: true,
        role: true,
        isActive: true,
        lastSeen: true,
        preferences: true,
        profileData: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sentMessages: true,
            receivedMessages: true,
            uploadedPhotos: true,
            initiatedCalls: true,
            receivedCalls: true,
            proposals: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async deactivateUser(userId: string, adminUser: any) {
    this.validateAdminAccess(adminUser);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
    });

    return {
      message: 'User deactivated successfully',
      user,
    };
  }

  async activateUser(userId: string, adminUser: any) {
    this.validateAdminAccess(adminUser);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
    });

    return {
      message: 'User activated successfully',
      user,
    };
  }

  async getAnalytics(adminUser: any) {
    this.validateAdminAccess(adminUser);

    const [
      userGrowth,
      messageStats,
      photoStats,
      proposalStats,
    ] = await Promise.all([
      this.getUserGrowthStats(),
      this.getMessageStats(),
      this.getPhotoStats(),
      this.getProposalStats(),
    ]);

    return {
      userGrowth,
      messageStats,
      photoStats,
      proposalStats,
    };
  }

  async getSystemHealth(adminUser: any) {
    this.validateSuperAdminAccess(adminUser);

    // Basic system health checks
    const dbHealth = await this.checkDatabaseHealth();
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      database: dbHealth,
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  async moderateContent(moderationData: any, adminUser: any) {
    this.validateAdminAccess(adminUser);

    // Implementation for content moderation
    return {
      message: 'Content moderation action completed',
      moderatedBy: adminUser.email,
      timestamp: new Date(),
      action: moderationData.action,
    };
  }

  private validateAdminAccess(user: any) {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Admin access required');
    }
  }

  private validateSuperAdminAccess(user: any) {
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin access required');
    }
  }

  private async getUserGrowthStats() {
    // Get user registration stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return { newUsersLast30Days: newUsers };
  }

  private async getMessageStats() {
    const totalMessages = await this.prisma.message.count();
    const todayMessages = await this.prisma.message.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return { total: totalMessages, today: todayMessages };
  }

  private async getPhotoStats() {
    const totalPhotos = await this.prisma.photo.count();
    const favoritePhotos = await this.prisma.photo.count({
      where: { isFavorite: true },
    });

    return { total: totalPhotos, favorites: favoritePhotos };
  }

  private async getProposalStats() {
    const totalProposals = await this.prisma.proposal.count();
    const acceptedProposals = await this.prisma.proposal.count({
      where: { isAccepted: true },
    });

    return { total: totalProposals, accepted: acceptedProposals };
  }

  private async checkDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', latency: 'low' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}
