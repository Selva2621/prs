import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProposalResponse {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export class RespondToProposalDto {
  @ApiProperty({
    description: 'The response to the proposal',
    enum: ProposalResponse,
    example: ProposalResponse.ACCEPTED,
  })
  @IsEnum(ProposalResponse)
  @IsNotEmpty()
  response: ProposalResponse;

  @ApiProperty({
    description: 'Optional message with the response',
    example: 'Yes! A thousand times yes! 💖',
    required: false,
  })
  @IsOptional()
  @IsString()
  responseMessage?: string;
}
