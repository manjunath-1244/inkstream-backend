import { Controller, Get, Query } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { SearchPostsDto } from './dto/search-posts.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get('posts')
  searchPosts(@Query() searchDto: SearchPostsDto, @CurrentUser() user?: any) {
    const { q, ...paginationDto } = searchDto;
    return this.postsService.searchPosts(q, paginationDto, user?.id);
  }
}
