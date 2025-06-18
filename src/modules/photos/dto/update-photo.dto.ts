import { PartialType } from '@nestjs/swagger';
import { CreatePhotoDto } from './create-photo.dto';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PhotoCategory } from '@prisma/client';

export class UpdatePhotoDto extends PartialType(CreatePhotoDto) {
  @ApiProperty({
    description: 'The updated title of the photo',
    example: 'Our Beautiful Memory (Updated)',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Updated description of the photo',
    example: 'A wonderful moment we shared together (updated)',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Updated category of the photo',
    enum: PhotoCategory,
    example: PhotoCategory.MEMORY,
    required: false,
  })
  @IsOptional()
  @IsEnum(PhotoCategory)
  category?: PhotoCategory;

  @ApiProperty({
    description: 'Updated visibility of the photo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: 'Updated metadata for the photo',
    example: { location: 'Paris', date: '2024-01-01', tags: ['romantic', 'sunset'] },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
