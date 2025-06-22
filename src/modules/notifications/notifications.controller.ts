import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

export interface UpdateFcmTokenDto {
    fcmToken: string;
    deviceType: string;
}

export interface UpdateNotificationSettingsDto {
    messages?: boolean;
    videoCalls?: boolean;
    proposals?: boolean;
    photos?: boolean;
    system?: boolean;
    sound?: boolean;
    vibration?: boolean;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Post('fcm-token')
    async updateFcmToken(@Request() req, @Body() dto: UpdateFcmTokenDto) {
        await this.notificationsService.updateFcmToken(req.user.id, dto.fcmToken, dto.deviceType);
        return { message: 'FCM token updated successfully' };
    }

    @Put('settings')
    async updateNotificationSettings(@Request() req, @Body() dto: UpdateNotificationSettingsDto) {
        await this.notificationsService.updateNotificationSettings(req.user.id, dto);
        return { message: 'Notification settings updated successfully' };
    }

    @Get()
    async getUserNotifications(
        @Request() req,
        @Query('limit') limit: string = '50',
        @Query('offset') offset: string = '0',
    ) {
        const notifications = await this.notificationsService.getUserNotifications(
            req.user.id,
            parseInt(limit),
            parseInt(offset),
        );
        return { notifications };
    }

    @Put(':id/read')
    async markNotificationAsRead(@Request() req, @Param('id') notificationId: string) {
        await this.notificationsService.markNotificationAsRead(notificationId, req.user.id);
        return { message: 'Notification marked as read' };
    }

    @Delete('old')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    async deleteOldNotifications(@Query('days') days: string = '30') {
        const deletedCount = await this.notificationsService.deleteOldNotifications(parseInt(days));
        return { message: `${deletedCount} old notifications deleted` };
    }
} 