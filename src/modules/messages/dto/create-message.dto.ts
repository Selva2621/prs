import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, my love! 💕',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'The ID of the message recipient',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @ApiProperty({
    description: 'The type of message',
    enum: MessageType,
    example: MessageType.TEXT,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiProperty({
    description: 'Additional metadata for the message',
    example: { emoji: '💕', location: { lat: 0, lng: 0 } },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
