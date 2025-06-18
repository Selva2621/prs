import { Module } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { VideoCallsController } from './video-calls.controller';
import { VideoCallsService } from './video-calls.service';

@Module({
  imports: [],
  controllers: [VideoCallsController],
  providers: [VideoCallsService, PrismaService],
  exports: [VideoCallsService, PrismaService],
})
export class VideoCallsModule { }
