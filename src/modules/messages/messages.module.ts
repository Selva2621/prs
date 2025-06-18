import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [forwardRef(() => WebSocketModule)],
  controllers: [MessagesController],
  providers: [MessagesService, PrismaService],
  exports: [MessagesService, PrismaService],
})
export class MessagesModule { }
