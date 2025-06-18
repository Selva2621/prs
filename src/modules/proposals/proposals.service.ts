import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { RespondToProposalDto } from './dto/respond-to-proposal.dto';
import { ProposalType } from '@prisma/client';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) { }

  async create(createProposalDto: CreateProposalDto, proposerId: string) {
    const proposal = await this.prisma.proposal.create({
      data: {
        title: createProposalDto.title,
        message: createProposalDto.message,
        type: createProposalDto.type || ProposalType.MARRIAGE,
        proposerId,
        customization: createProposalDto.customization || {},
      },
      include: {
        proposer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return proposal;
  }

  async findAll(userId: string, type?: string) {
    const where: any = {
      proposerId: userId,
    };

    if (type) {
      where.type = type;
    }

    const proposals = await this.prisma.proposal.findMany({
      where,
      include: {
        proposer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return proposals;
  }

  async findSent(userId: string) {
    const proposals = await this.prisma.proposal.findMany({
      where: {
        proposerId: userId,
      },
      include: {
        proposer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return proposals;
  }

  async findReceived(userId: string) {
    // Since there's no proposeeId field, return empty array for now
    return [];
  }

  async findOne(id: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        proposer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    // Check if user has access to this proposal (only proposer for now)
    if (proposal.proposerId !== userId) {
      throw new ForbiddenException('You do not have access to this proposal');
    }

    return proposal;
  }

  async update(id: string, updateProposalDto: UpdateProposalDto, userId: string) {
    const proposal = await this.findOne(id, userId);

    // Only proposer can update proposal
    if (proposal.proposerId !== userId) {
      throw new ForbiddenException('You can only update your own proposals');
    }

    // Cannot update if already responded
    if (proposal.response) {
      throw new Error('Cannot update proposal that has already been responded to');
    }

    const updatedProposal = await this.prisma.proposal.update({
      where: { id },
      data: {
        title: updateProposalDto.title,
        message: updateProposalDto.message,
        type: updateProposalDto.type,
        customization: updateProposalDto.customization ? {
          ...(proposal.customization as object || {}),
          ...updateProposalDto.customization,
        } : proposal.customization,
      },
      include: {
        proposer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedProposal;
  }

  async respond(id: string, respondToProposalDto: RespondToProposalDto, userId: string) {
    const proposal = await this.findOne(id, userId);

    // Cannot respond if already responded
    if (proposal.response) {
      throw new Error('You have already responded to this proposal');
    }

    const updatedProposal = await this.prisma.proposal.update({
      where: { id },
      data: {
        response: respondToProposalDto.response,
        isAccepted: respondToProposalDto.response === 'ACCEPTED',
        respondedAt: new Date(),
      },
      include: {
        proposer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedProposal;
  }

  async remove(id: string, userId: string) {
    const proposal = await this.findOne(id, userId);

    // Only proposer can delete proposal
    if (proposal.proposerId !== userId) {
      throw new ForbiddenException('You can only delete your own proposals');
    }

    await this.prisma.proposal.delete({
      where: { id },
    });

    return { message: 'Proposal deleted successfully' };
  }
}
