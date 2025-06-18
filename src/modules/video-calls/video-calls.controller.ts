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
import { VideoCallsService } from './video-calls.service';
import { CreateVideoCallDto } from './dto/create-video-call.dto';
import { UpdateVideoCallDto } from './dto/update-video-call.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Video Calls')
@ApiBearerAuth()
@Controller('video-calls')
@UseGuards(JwtAuthGuard)
export class VideoCallsController {
  constructor(private readonly videoCallsService: VideoCallsService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a new video call' })
  @ApiResponse({ status: 201, description: 'Video call initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createVideoCallDto: CreateVideoCallDto, @Request() req) {
    return this.videoCallsService.create(createVideoCallDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get video call history for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Video calls retrieved successfully' })
  async findAll(@Request() req, @Query('status') status?: string) {
    return this.videoCallsService.findAll(req.user.id, status);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active video calls for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Active video calls retrieved successfully' })
  async findActive(@Request() req) {
    return this.videoCallsService.findActive(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific video call by ID' })
  @ApiResponse({ status: 200, description: 'Video call retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Video call not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.videoCallsService.findOne(id, req.user.id);
  }

  @Patch(':id/answer')
  @ApiOperation({ summary: 'Answer a video call' })
  @ApiResponse({ status: 200, description: 'Video call answered successfully' })
  @ApiResponse({ status: 404, description: 'Video call not found' })
  async answerCall(@Param('id') id: string, @Request() req) {
    return this.videoCallsService.answerCall(id, req.user.id);
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: 'Decline a video call' })
  @ApiResponse({ status: 200, description: 'Video call declined successfully' })
  @ApiResponse({ status: 404, description: 'Video call not found' })
  async declineCall(@Param('id') id: string, @Request() req) {
    return this.videoCallsService.declineCall(id, req.user.id);
  }

  @Patch(':id/end')
  @ApiOperation({ summary: 'End a video call' })
  @ApiResponse({ status: 200, description: 'Video call ended successfully' })
  @ApiResponse({ status: 404, description: 'Video call not found' })
  async endCall(@Param('id') id: string, @Request() req) {
    return this.videoCallsService.endCall(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update video call metadata' })
  @ApiResponse({ status: 200, description: 'Video call updated successfully' })
  @ApiResponse({ status: 404, description: 'Video call not found' })
  async update(
    @Param('id') id: string,
    @Body() updateVideoCallDto: UpdateVideoCallDto,
    @Request() req,
  ) {
    return this.videoCallsService.update(id, updateVideoCallDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a video call record' })
  @ApiResponse({ status: 200, description: 'Video call deleted successfully' })
  @ApiResponse({ status: 404, description: 'Video call not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.videoCallsService.remove(id, req.user.id);
  }
}
