import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProposalType } from '@prisma/client';

export class CreateProposalDto {
  @ApiProperty({
    description: 'The title of the proposal',
    example: 'Will you marry me?',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The proposal message',
    example: 'My dearest love, you are my universe and I want to spend eternity with you...',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'The type of proposal',
    enum: ProposalType,
    example: ProposalType.MARRIAGE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProposalType)
  type?: ProposalType;

  @ApiProperty({
    description: 'Customization options for the proposal',
    example: {
      theme: 'cosmic',
      music: 'romantic-ballad.mp3',
      animation: 'falling-stars',
      colors: ['#ff69b4', '#9370db']
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customization?: any;
}
