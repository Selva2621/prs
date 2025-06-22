import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { FirebaseConfig } from '../../config/firebase.config';
import * as admin from 'firebase-admin';

export interface NotificationData {
    type: 'message' | 'video_call' | 'call_accepted' | 'call_declined' | 'call_missed' | 'proposal' | 'photo_upload' | 'system';
    title: string;
    body: string;
    data?: Record<string, any>;
    userId: string;
    priority?: 'high' | 'default';
    sound?: string;
    badge?: number;
    ringtone?: string;
    vibration?: boolean;
}

export interface NotificationSettings {
    messages: boolean;
    videoCalls: boolean;
    proposals: boolean;
    photos: boolean;
    system: boolean;
    sound: boolean;
    vibration: boolean;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private prisma: PrismaService,
        private firebaseConfig: FirebaseConfig,
    ) { }

    /**
     * Send push notification to a specific user
     */
    async sendNotification(notificationData: NotificationData): Promise<boolean> {
        try {
            // Get user's FCM token and notification settings
            const user = await this.prisma.user.findUnique({
                where: { id: notificationData.userId },
                select: {
                    id: true,
                    fcmToken: true,
                    notificationSettings: true,
                    isOnline: true,
                    fullName: true,
                },
            });

            if (!user || !user.fcmToken) {
                this.logger.warn(`No FCM token found for user ${notificationData.userId}`);
                return false;
            }

            // Check notification settings
            const rawSettings = user.notificationSettings;
            const settings: NotificationSettings = (rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings))
                ? (rawSettings as unknown as NotificationSettings)
                : {
                    messages: true,
                    videoCalls: true,
                    proposals: true,
                    photos: true,
                    system: true,
                    sound: true,
                    vibration: true,
                };

            // Check if this type of notification is enabled
            if (!this.isNotificationEnabled(notificationData.type, settings)) {
                this.logger.debug(`Notification type ${notificationData.type} is disabled for user ${notificationData.userId}`);
                return false;
            }

            // Create notification record in database
            const notification = await this.prisma.notification.create({
                data: {
                    type: this.mapNotificationType(notificationData.type),
                    title: notificationData.title,
                    body: notificationData.body,
                    data: notificationData.data || {},
                    userId: user.id,
                },
            });

            // Prepare FCM message
            const message: admin.messaging.Message = {
                token: user.fcmToken,
                notification: {
                    title: notificationData.title,
                    body: notificationData.body,
                },
                data: {
                    ...notificationData.data,
                    notificationId: notification.id,
                    type: notificationData.type,
                    userId: user.id,
                },
                android: {
                    priority: notificationData.priority === 'high' ? 'high' : 'normal',
                    notification: {
                        sound: notificationData.sound || (settings.sound ? 'default' : undefined),
                        channelId: this.getChannelId(notificationData.type),
                        priority: notificationData.priority === 'high' ? 'high' : 'default',
                        defaultSound: settings.sound,
                        defaultVibrateTimings: notificationData.vibration !== undefined ? notificationData.vibration : settings.vibration,
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: notificationData.sound || (settings.sound ? 'default' : undefined),
                            badge: notificationData.badge || 1,
                            category: this.getCategory(notificationData.type),
                        },
                    },
                },
            };

            // Send notification via Firebase
            const messaging = this.firebaseConfig.getMessaging();
            const response = await messaging.send(message);

            // Update notification record
            await this.prisma.notification.update({
                where: { id: notification.id },
                data: {
                    isSent: true,
                    sentAt: new Date(),
                },
            });

            this.logger.log(`Notification sent successfully to user ${user.id}: ${response}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send notification to user ${notificationData.userId}:`, error);

            // Update notification record with error
            if (notificationData.userId) {
                await this.prisma.notification.updateMany({
                    where: {
                        userId: notificationData.userId,
                        title: notificationData.title,
                        isSent: false,
                    },
                    data: {
                        error: error.message,
                        retryCount: { increment: 1 },
                    },
                });
            }

            return false;
        }
    }

    /**
     * Send message notification
     */
    async sendMessageNotification(
        recipientId: string,
        senderName: string,
        messageContent: string,
        messageId: string,
    ): Promise<boolean> {
        return this.sendNotification({
            type: 'message',
            title: `New message from ${senderName}`,
            body: messageContent.length > 50 ? `${messageContent.substring(0, 50)}...` : messageContent,
            data: {
                messageId,
                senderName,
                action: 'open_chat',
            },
            userId: recipientId,
            priority: 'high',
        });
    }

    /**
     * Send video call notification
     */
    async sendVideoCallNotification(
        recipientId: string,
        callerName: string,
        callId: string,
    ): Promise<boolean> {
        return this.sendNotification({
            type: 'video_call',
            title: `Incoming video call from ${callerName}`,
            body: 'Tap to answer',
            data: {
                callId,
                callerName,
                action: 'video_call',
                type: 'incoming_call',
                ringtone: 'incoming_call',
                vibration: true,
            },
            userId: recipientId,
            priority: 'high',
            sound: 'ringtone',
        });
    }

    /**
     * Send call accepted notification
     */
    async sendCallAcceptedNotification(
        callerId: string,
        calleeName: string,
        callId: string,
    ): Promise<boolean> {
        return this.sendNotification({
            type: 'call_accepted',
            title: `${calleeName} answered your call`,
            body: 'Connecting...',
            data: {
                callId,
                calleeName,
                action: 'video_call',
                type: 'call_accepted',
            },
            userId: callerId,
            priority: 'high',
        });
    }

    /**
     * Send call declined notification
     */
    async sendCallDeclinedNotification(
        callerId: string,
        calleeName: string,
        callId: string,
    ): Promise<boolean> {
        return this.sendNotification({
            type: 'call_declined',
            title: `${calleeName} declined your call`,
            body: 'Call ended',
            data: {
                callId,
                calleeName,
                action: 'call_declined',
            },
            userId: callerId,
            priority: 'default',
        });
    }

    /**
     * Send call missed notification
     */
    async sendCallMissedNotification(
        calleeId: string,
        callerName: string,
        callId: string,
    ): Promise<boolean> {
        return this.sendNotification({
            type: 'call_missed',
            title: `Missed call from ${callerName}`,
            body: 'You missed a video call',
            data: {
                callId,
                callerName,
                action: 'call_missed',
            },
            userId: calleeId,
            priority: 'default',
        });
    }

    /**
     * Update user's FCM token
     */
    async updateFcmToken(userId: string, fcmToken: string, deviceType: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                fcmToken,
                deviceType,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Update user's notification settings
     */
    async updateNotificationSettings(
        userId: string,
        settings: Partial<NotificationSettings>,
    ): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                notificationSettings: settings,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
        await this.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    /**
     * Get user's notifications
     */
    async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Delete old notifications
     */
    async deleteOldNotifications(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
                isRead: true,
            },
        });

        return result.count;
    }

    /**
     * Check if notification type is enabled in user settings
     */
    private isNotificationEnabled(type: string, settings: NotificationSettings): boolean {
        switch (type) {
            case 'message':
                return settings.messages;
            case 'video_call':
            case 'call_accepted':
            case 'call_declined':
            case 'call_missed':
                return settings.videoCalls;
            case 'proposal':
                return settings.proposals;
            case 'photo_upload':
                return settings.photos;
            case 'system':
                return settings.system;
            default:
                return true;
        }
    }

    /**
     * Map notification type to enum
     */
    private mapNotificationType(type: string): 'MESSAGE' | 'VIDEO_CALL' | 'CALL_ACCEPTED' | 'CALL_DECLINED' | 'CALL_MISSED' | 'PROPOSAL' | 'PHOTO_UPLOAD' | 'SYSTEM' {
        const typeMap: Record<string, 'MESSAGE' | 'VIDEO_CALL' | 'CALL_ACCEPTED' | 'CALL_DECLINED' | 'CALL_MISSED' | 'PROPOSAL' | 'PHOTO_UPLOAD' | 'SYSTEM'> = {
            message: 'MESSAGE',
            video_call: 'VIDEO_CALL',
            call_accepted: 'CALL_ACCEPTED',
            call_declined: 'CALL_DECLINED',
            call_missed: 'CALL_MISSED',
            proposal: 'PROPOSAL',
            photo_upload: 'PHOTO_UPLOAD',
            system: 'SYSTEM',
        };
        return typeMap[type] || 'SYSTEM';
    }

    /**
     * Get Android channel ID for notification type
     */
    private getChannelId(type: string): string {
        const channelMap = {
            message: 'messages',
            video_call: 'video_calls',
            call_accepted: 'video_calls',
            call_declined: 'video_calls',
            call_missed: 'video_calls',
            proposal: 'proposals',
            photo_upload: 'photos',
            system: 'system',
        };
        return channelMap[type] || 'general';
    }

    /**
     * Get iOS category for notification type
     */
    private getCategory(type: string): string {
        const categoryMap = {
            message: 'MESSAGE',
            video_call: 'VIDEO_CALL',
            call_accepted: 'VIDEO_CALL',
            call_declined: 'VIDEO_CALL',
            call_missed: 'VIDEO_CALL',
            proposal: 'PROPOSAL',
            photo_upload: 'PHOTO',
            system: 'SYSTEM',
        };
        return categoryMap[type] || 'GENERAL';
    }
} 