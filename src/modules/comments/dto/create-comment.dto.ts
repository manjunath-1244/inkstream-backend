import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great insights!', description: 'The content of the comment' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false, description: 'ID of the parent comment if this is a reply' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
