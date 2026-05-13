import { IsEmail, MinLength, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.trim())
  email!: string;

  @ApiProperty({
    description: 'Unique username for the user',
    example: 'johndoe123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({
    description: 'User password',
    minLength: 6,
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @ApiProperty({
    description: 'Display name for the user profile',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  displayName!: string;
}