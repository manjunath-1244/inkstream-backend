import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PostVisibility, Post as PostEntity } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SharePostDto } from './dto/share-post.dto';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post()
  @Roles(Role.CREATOR, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiCreatedResponse({
    type: PostEntity,
    description: 'Post created successfully',
  })
  create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: any) {
    return this.postsService.create(createPostDto, user.id);
  }

  @Public()
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all published posts' })
  @ApiOkResponse({ description: 'Returns paginated list of posts' })
  findAll(@Query() paginationDto: PaginationDto, @CurrentUser() user?: any) {
    return this.postsService.findAll(paginationDto, user?.id);
  }

  @Public()
  @Get('trending')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trending posts' })
  @ApiOkResponse({
    description:
      'Returns paginated list of trending posts based on likes and comments',
  })
  getTrending(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user?: any,
  ) {
    return this.postsService.getTrending(paginationDto, user?.id);
  }

  @Get('me/drafts')
  @Roles(Role.CREATOR, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user drafts' })
  @ApiOkResponse({ description: 'Returns paginated list of user drafts' })
  findMyDrafts(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: any,
  ) {
    return this.postsService.findMyDrafts(user.id, paginationDto);
  }

  @Public()
  @Get(':idOrSlug')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single post by ID or Slug' })
  @ApiParam({ name: 'idOrSlug', description: 'Post UUID or URL slug' })
  @ApiOkResponse({ type: PostEntity, description: 'Returns the post data' })
  async findOne(@Param('idOrSlug') idOrSlug: string, @CurrentUser() user: any) {
    const post = await this.postsService.findOne(idOrSlug);

    // Increment view count
    await this.postsService.incrementViewCount(post.id);

    // Subscription Check for Premium Content
    if (post.visibility === PostVisibility.PREMIUM) {
      if (!user) {
        throw new ForbiddenException('This is premium content. Please log in.');
      }
      const subscription =
        await this.subscriptionsService.findActiveSubscription(user.id);
      if (!subscription) {
        throw new ForbiddenException(
          'This content requires an active subscription',
        );
      }
    }

    return post;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOkResponse({ type: PostEntity, description: 'Post updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: any,
  ) {
    return this.postsService.update(id, updatePostDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOkResponse({ description: 'Post deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.postsService.remove(id, user);
  }

  @Public()
  @Post(':id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a post share' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOkResponse({ description: 'Share recorded successfully' })
  async share(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SharePostDto,
    @CurrentUser() user: any,
  ) {
    await this.postsService.incrementShareCount(id, dto.channel, user?.id);
    return {
      message: 'Shared successfully',
      shareUrl: `https://inkstream.local/p/${id}`,
    };
  }

  @Get(':id/share-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get share statistics for a post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOkResponse({ description: 'Returns share counts grouped by channel' })
  async getShareStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const post = await this.postsService.findOne(id);
    // Author or admin only
    if (user.role !== Role.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to view stats for this post',
      );
    }
    return this.postsService.getShareStats(id);
  }
}
