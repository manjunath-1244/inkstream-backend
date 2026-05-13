import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The reset token received via email',
    example: 'abc-123-xyz',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    description: 'The new password for the account',
    minLength: 6,
    example: 'newSecurePassword123',
  })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
