import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { PostStatus, PostVisibility } from '../entities/post.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({ example: 'Updated Title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: '# Updated Content', required: false })
  @IsOptional()
  @IsString()
  contentMarkdown?: string;

  @ApiProperty({ example: 'Updated summary', required: false })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ enum: PostStatus, required: false })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({ enum: PostVisibility, required: false })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: ['123e4567-e89b-12d3-a456-426614174001'], isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @ApiProperty({ example: 'https://example.com/updated-image.jpg', required: false })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}
