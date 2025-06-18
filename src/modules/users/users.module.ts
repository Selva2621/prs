import { Module } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [PrismaService, UsersService],
  exports: [PrismaService, UsersService],
})
export class UsersModule { }
