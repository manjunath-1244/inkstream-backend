import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';
import { PostStatus, PostVisibility } from '../entities/post.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'My New Post', description: 'The title of the post' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: '# Content\nMarkdown content here',
    description: 'The post content in Markdown format',
  })
  @IsString()
  @IsNotEmpty()
  contentMarkdown!: string;

  @ApiProperty({ example: 'Short summary', required: false })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ enum: PostStatus, default: PostStatus.DRAFT, required: false })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174001'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: ['automation', 'playwright'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
