import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'johndoe', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  username?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  displayName?: string;

  @ApiProperty({ example: 'I am a creator on InkStream', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  bio?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: 'https://johndoe.com', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;
}
