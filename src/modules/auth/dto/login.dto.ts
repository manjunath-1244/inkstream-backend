import { IsEmail, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @Transform(({ value }) => (value as string)?.trim())
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'strongPassword123',
  })
  @MinLength(6)
  password!: string;
}
