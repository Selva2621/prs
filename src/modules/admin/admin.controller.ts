import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@Request() req) {
    return this.adminService.getDashboardData(req.user);
  }

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users for admin management' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(@Request() req) {
    return this.adminService.getAllUsers(req.user);
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  async getUserById(@Param('id') id: string, @Request() req) {
    return this.adminService.getUserById(id, req.user);
  }

  @Post('users/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a user account' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  async deactivateUser(@Param('id') id: string, @Request() req) {
    return this.adminService.deactivateUser(id, req.user);
  }

  @Post('users/:id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate a user account' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  async activateUser(@Param('id') id: string, @Request() req) {
    return this.adminService.activateUser(id, req.user);
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get platform analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved successfully' })
  async getAnalytics(@Request() req) {
    return this.adminService.getAnalytics(req.user);
  }

  @Get('system/health')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get system health status (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getSystemHealth(@Request() req) {
    return this.adminService.getSystemHealth(req.user);
  }

  @Post('content/moderate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Moderate content (photos, messages, etc.)' })
  @ApiResponse({ status: 200, description: 'Content moderated successfully' })
  async moderateContent(@Body() moderationData: any, @Request() req) {
    return this.adminService.moderateContent(moderationData, req.user);
  }
}
