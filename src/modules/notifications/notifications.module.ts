import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../../config/prisma.service';
import { FirebaseConfig } from '../../config/firebase.config';

@Module({
    providers: [NotificationsService, PrismaService, FirebaseConfig],
    controllers: [NotificationsController],
    exports: [NotificationsService],
})
export class NotificationsModule { } 