import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaService } from '../../config/prisma.service';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/photos',
    }),
  ],
  controllers: [PhotosController],
  providers: [PhotosService, PrismaService],
  exports: [PhotosService, PrismaService],
})
export class PhotosModule { }
