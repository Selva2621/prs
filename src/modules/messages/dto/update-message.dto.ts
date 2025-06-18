import { PartialType } from '@nestjs/swagger';
import { CreateMessageDto } from './create-message.dto';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  @ApiProperty({
    description: 'The updated content of the message',
    example: 'Hello, my love! 💕 (edited)',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;
}
