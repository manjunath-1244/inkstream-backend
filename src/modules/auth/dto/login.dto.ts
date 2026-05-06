import { IsEmail, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => value?.trim())
  email!: string;

  @MinLength(6)
  password!: string;
}