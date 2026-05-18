import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { PostType } from './dto/post.type';
import { PaginatedPostsType } from './dto/paginated-posts.type';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Resolver(() => PostType)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => PaginatedPostsType, {
    name: 'posts',
    description: 'Get paginated list of all published posts',
  })
  async getPosts(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('userId', { type: () => String, nullable: true }) userId?: string,
  ): Promise<PaginatedPostsType> {
    const paginationDto: PaginationDto = {
      page: page || 1,
      limit: limit || 10,
    };
    const result = await this.postsService.findAll(paginationDto, userId);
    return result;
  }

  @Query(() => PaginatedPostsType, {
    name: 'trendingPosts',
    description: 'Get paginated list of trending posts within the last 7 days',
  })
  async getTrendingPosts(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('userId', { type: () => String, nullable: true }) userId?: string,
  ): Promise<PaginatedPostsType> {
    const paginationDto: PaginationDto = {
      page: page || 1,
      limit: limit || 10,
    };
    const result = await this.postsService.getTrending(paginationDto, userId);
    return result;
  }

  @Query(() => PostType, {
    name: 'post',
    description: 'Get a single post by its ID or slug',
  })
  async getPost(
    @Args('idOrSlug', { type: () => String }) idOrSlug: string,
  ): Promise<PostType> {
    const post = await this.postsService.findOne(idOrSlug);
    return post;
  }
}
