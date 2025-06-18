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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagesService.create(createMessageDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async findAll(@Request() req, @Query('recipientId') recipientId?: string) {
    return this.messagesService.findAll(req.user.id, recipientId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific message by ID' })
  @ApiResponse({ status: 200, description: 'Message retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.messagesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req,
  ) {
    return this.messagesService.update(id, updateMessageDto, req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.messagesService.markAsRead(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.messagesService.remove(id, req.user.id);
  }
}
