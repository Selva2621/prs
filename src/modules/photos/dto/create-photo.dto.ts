import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PhotoCategory } from '@prisma/client';

export class CreatePhotoDto {
  @ApiProperty({
    description: 'The title of the photo',
    example: 'Our Beautiful Memory',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Description of the photo',
    example: 'A wonderful moment we shared together',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Category of the photo',
    enum: PhotoCategory,
    example: PhotoCategory.COUPLE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PhotoCategory)
  category?: PhotoCategory;

  @ApiProperty({
    description: 'Whether the photo is public',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: 'Additional metadata for the photo',
    example: { location: 'Paris', date: '2024-01-01' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The photo file to upload',
  })
  file: any;
}
