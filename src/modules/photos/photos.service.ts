import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { PhotoCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService) { }

  async create(createPhotoDto: CreatePhotoDto, file: Express.Multer.File, uploadedById: string) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'photos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save photo metadata to database
    const photo = await this.prisma.photo.create({
      data: {
        title: createPhotoDto.title || file.originalname,
        description: createPhotoDto.description,
        fileUrl: `/uploads/photos/${fileName}`,
        fileSize: file.size,
        fileType: file.mimetype,
        category: createPhotoDto.category || PhotoCategory.OTHER,
        uploadedById,
        metadata: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          ...createPhotoDto.metadata,
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return photo;
  }

  async findAll(userId: string, category?: string) {
    const where: any = {
      uploadedById: userId,
    };

    if (category) {
      where.category = category;
    }

    const photos = await this.prisma.photo.findMany({
      where,
      include: {
        uploadedBy: {
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

    return photos;
  }

  async findShared(userId: string) {
    // Find photos that are visible and not uploaded by the user
    const photos = await this.prisma.photo.findMany({
      where: {
        isVisible: true,
        uploadedById: { not: userId },
      },
      include: {
        uploadedBy: {
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

    return photos;
  }

  async findOne(id: string, userId: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    // Check if user has access to this photo
    if (photo.uploadedById !== userId && !photo.isVisible) {
      throw new ForbiddenException('You do not have access to this photo');
    }

    return photo;
  }

  async update(id: string, updatePhotoDto: UpdatePhotoDto, userId: string) {
    const photo = await this.findOne(id, userId);

    // Only owner can update photo
    if (photo.uploadedById !== userId) {
      throw new ForbiddenException('You can only update your own photos');
    }

    const updatedPhoto = await this.prisma.photo.update({
      where: { id },
      data: {
        title: updatePhotoDto.title,
        description: updatePhotoDto.description,
        category: updatePhotoDto.category,
        isVisible: updatePhotoDto.isPublic,
        metadata: updatePhotoDto.metadata ? {
          ...(photo.metadata as object || {}),
          ...updatePhotoDto.metadata,
        } : photo.metadata,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedPhoto;
  }

  async sharePhoto(id: string, targetUserId: string, userId: string) {
    const photo = await this.findOne(id, userId);

    // Only owner can share photo
    if (photo.uploadedById !== userId) {
      throw new ForbiddenException('You can only share your own photos');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Make photo visible so it can be accessed by the target user
    const updatedPhoto = await this.prisma.photo.update({
      where: { id },
      data: { isVisible: true },
    });

    return { message: 'Photo shared successfully', photo: updatedPhoto };
  }

  async remove(id: string, userId: string) {
    const photo = await this.findOne(id, userId);

    // Only owner can delete photo
    if (photo.uploadedById !== userId) {
      throw new ForbiddenException('You can only delete your own photos');
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), photo.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await this.prisma.photo.delete({
      where: { id },
    });

    return { message: 'Photo deleted successfully' };
  }
}
