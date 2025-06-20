import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'lover@cosmic.love' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'cosmicLove123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'My Beloved', required: false })
  @IsOptional()
  @IsString()
  full_name?: string;
}
