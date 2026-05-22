import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { PostType } from './dto/post.type';
import { PaginatedPostsType } from './dto/paginated-posts.type';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';

@Resolver(() => PostType)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Public()
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

  @Public()
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

  @Public()
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

  @Roles(Role.CREATOR, Role.ADMIN)
  @Mutation(() => PostType, {
    name: 'createPost',
    description: 'Create a new post',
  })
  async createPost(
    @Args('createPostInput') createPostInput: CreatePostInput,
    @CurrentUser() user: any,
  ): Promise<PostType> {
    return this.postsService.create(createPostInput, user.id);
  }

  @Mutation(() => PostType, {
    name: 'updatePost',
    description: 'Update a post',
  })
  async updatePost(
    @Args('id', { type: () => ID }) id: string,
    @Args('updatePostInput') updatePostInput: UpdatePostInput,
    @CurrentUser() user: any,
  ): Promise<PostType> {
    return this.postsService.update(id, updatePostInput, user);
  }

  @Mutation(() => Boolean, {
    name: 'deletePost',
    description: 'Soft delete a post',
  })
  async deletePost(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    await this.postsService.remove(id, user);
    return true;
  }
}
