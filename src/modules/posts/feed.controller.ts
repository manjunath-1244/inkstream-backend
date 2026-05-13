import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Posts')
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized feed for the logged-in user' })
  @ApiOkResponse({ description: 'Returns paginated list of posts from followed users' })
  getFeed(@Query() paginationDto: PaginationDto, @CurrentUser() user: any) {
    return this.postsService.getFeed(user.id, paginationDto);
  }
}
