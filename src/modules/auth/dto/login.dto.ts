import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'lover@cosmic.love' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'cosmicLove123' })
  @IsString()
  password: string;
}
