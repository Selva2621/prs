import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './config/prisma.service';
import { FirebaseConfig } from './config/firebase.config';

// Import modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PhotosModule } from './modules/photos/photos.module';
import { VideoCallsModule } from './modules/video-calls/video-calls.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Feature modules
    AuthModule,
    UsersModule,
    MessagesModule,
    PhotosModule,
    VideoCallsModule,
    ProposalsModule,
    WebSocketModule,
    AdminModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, FirebaseConfig],
  exports: [PrismaService, FirebaseConfig],
})
export class AppModule { }
