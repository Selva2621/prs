import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoCallDto {
  @ApiProperty({
    description: 'The ID of the user to call',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  calleeId: string;

  @ApiProperty({
    description: 'Additional metadata for the video call',
    example: { quality: 'HD', platform: 'mobile' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
