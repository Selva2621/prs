import { Module } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';

@Module({
  imports: [],
  controllers: [ProposalsController],
  providers: [ProposalsService, PrismaService],
  exports: [ProposalsService, PrismaService],
})
export class ProposalsModule { }
