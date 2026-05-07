import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
