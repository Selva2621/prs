import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { RespondToProposalDto } from './dto/respond-to-proposal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Proposals')
@ApiBearerAuth()
@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new proposal' })
  @ApiResponse({ status: 201, description: 'Proposal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createProposalDto: CreateProposalDto, @Request() req) {
    return this.proposalsService.create(createProposalDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get proposals for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Proposals retrieved successfully' })
  async findAll(@Request() req, @Query('type') type?: string) {
    return this.proposalsService.findAll(req.user.id, type);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get proposals sent by the authenticated user' })
  @ApiResponse({ status: 200, description: 'Sent proposals retrieved successfully' })
  async findSent(@Request() req) {
    return this.proposalsService.findSent(req.user.id);
  }

  @Get('received')
  @ApiOperation({ summary: 'Get proposals received by the authenticated user' })
  @ApiResponse({ status: 200, description: 'Received proposals retrieved successfully' })
  async findReceived(@Request() req) {
    return this.proposalsService.findReceived(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific proposal by ID' })
  @ApiResponse({ status: 200, description: 'Proposal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.proposalsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a proposal' })
  @ApiResponse({ status: 200, description: 'Proposal updated successfully' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProposalDto: UpdateProposalDto,
    @Request() req,
  ) {
    return this.proposalsService.update(id, updateProposalDto, req.user.id);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Respond to a proposal' })
  @ApiResponse({ status: 200, description: 'Response recorded successfully' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async respond(
    @Param('id') id: string,
    @Body() respondToProposalDto: RespondToProposalDto,
    @Request() req,
  ) {
    return this.proposalsService.respond(id, respondToProposalDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a proposal' })
  @ApiResponse({ status: 200, description: 'Proposal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.proposalsService.remove(id, req.user.id);
  }
}
