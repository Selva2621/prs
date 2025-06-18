import { PartialType } from '@nestjs/swagger';
import { CreateVideoCallDto } from './create-video-call.dto';
import { IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVideoCallDto extends PartialType(CreateVideoCallDto) {
  @ApiProperty({
    description: 'Updated metadata for the video call',
    example: { quality: 'HD', platform: 'mobile', rating: 5 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
