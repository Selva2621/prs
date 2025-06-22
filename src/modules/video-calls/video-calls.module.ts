import { Module } from '@nestjs/common';
import { VideoCallsService } from './video-calls.service';
import { VideoCallsController } from './video-calls.controller';
import { PrismaService } from '../../config/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [VideoCallsController],
  providers: [VideoCallsService, PrismaService],
  exports: [VideoCallsService],
})
export class VideoCallsModule { }
