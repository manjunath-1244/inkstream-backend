import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { PostStatus, PostVisibility } from '../entities/post.entity';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  contentMarkdown?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}
