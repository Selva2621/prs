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
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Express } from 'express';

@ApiTags('Photos')
@ApiBearerAuth()
@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a new photo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createPhotoDto: CreatePhotoDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.photosService.create(createPhotoDto, file, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all photos for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Photos retrieved successfully' })
  async findAll(@Request() req, @Query('category') category?: string) {
    return this.photosService.findAll(req.user.id, category);
  }

  @Get('shared')
  @ApiOperation({ summary: 'Get photos shared with the authenticated user' })
  @ApiResponse({ status: 200, description: 'Shared photos retrieved successfully' })
  async findShared(@Request() req) {
    return this.photosService.findShared(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific photo by ID' })
  @ApiResponse({ status: 200, description: 'Photo retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.photosService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update photo metadata' })
  @ApiResponse({ status: 200, description: 'Photo updated successfully' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePhotoDto: UpdatePhotoDto,
    @Request() req,
  ) {
    return this.photosService.update(id, updatePhotoDto, req.user.id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share a photo with another user' })
  @ApiResponse({ status: 200, description: 'Photo shared successfully' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async sharePhoto(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Request() req,
  ) {
    return this.photosService.sharePhoto(id, userId, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a photo' })
  @ApiResponse({ status: 200, description: 'Photo deleted successfully' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.photosService.remove(id, req.user.id);
  }
}
