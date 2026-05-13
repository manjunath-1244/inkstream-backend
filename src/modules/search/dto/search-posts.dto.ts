import { IsString, IsNotEmpty } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SearchPostsDto extends PaginationDto {
  @ApiProperty({ example: 'nest js', description: 'Search query string' })
  @IsString()
  @IsNotEmpty()
  q!: string;
}
