import { IsString, IsNotEmpty } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchPostsDto extends PaginationDto {
  @IsString()
  @IsNotEmpty()
  q!: string;
}
