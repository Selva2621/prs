import { PartialType } from '@nestjs/swagger';
import { CreateProposalDto } from './create-proposal.dto';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProposalType } from '@prisma/client';

export class UpdateProposalDto extends PartialType(CreateProposalDto) {
  @ApiProperty({
    description: 'Updated title of the proposal',
    example: 'Will you marry me? (Updated)',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Updated proposal message',
    example: 'My dearest love, you are my universe... (updated)',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: 'Updated type of proposal',
    enum: ProposalType,
    example: ProposalType.ANNIVERSARY,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProposalType)
  type?: ProposalType;

  @ApiProperty({
    description: 'Updated customization options',
    example: {
      theme: 'romantic',
      music: 'love-song.mp3',
      animation: 'hearts',
      colors: ['#ff1493', '#ff69b4']
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customization?: any;
}
