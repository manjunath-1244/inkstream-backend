import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email address to receive reset link',
    example: 'user@example.com',
  })
  @IsEmail()
  @Transform(({ value }) => value?.trim())
  email!: string;
}
