import { Controller, Get, Query } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get('posts')
  searchPosts(@Query('q') q: string, @Query() paginationDto: PaginationDto) {
    return this.postsService.searchPosts(q, paginationDto);
  }
}
