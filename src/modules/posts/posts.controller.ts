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
import { PostVisibility } from './entities/post.entity';
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

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post()
  @Roles(Role.CREATOR, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: any) {
    return this.postsService.create(createPostDto, user.id);
  }

  @Public()
  @Get()
  findAll(@Query() paginationDto: PaginationDto, @CurrentUser() user?: any) {
    return this.postsService.findAll(paginationDto, user?.id);
  }

  @Public()
  @Get('trending')
  getTrending(@Query() paginationDto: PaginationDto, @CurrentUser() user?: any) {
    return this.postsService.getTrending(paginationDto, user?.id);
  }



  @Get('me/drafts')
  @Roles(Role.CREATOR, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findMyDrafts(@Query() paginationDto: PaginationDto, @CurrentUser() user: any) {
    return this.postsService.findMyDrafts(user.id, paginationDto);
  }

  @Public()
  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string, @CurrentUser() user: any) {
    const post = await this.postsService.findOne(idOrSlug);
    
    // Increment view count
    await this.postsService.incrementViewCount(post.id);

    // Subscription Check for Premium Content
    if (post.visibility === PostVisibility.PREMIUM) {
      if (!user) {
        throw new ForbiddenException('This is premium content. Please log in.');
      }
      const subscription = await this.subscriptionsService.findActiveSubscription(user.id);
      if (!subscription) {
        throw new ForbiddenException('This content requires an active subscription');
      }
    }

    return post;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: any,
  ) {
    return this.postsService.update(id, updatePostDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.postsService.remove(id, user);
  }

  @Public()
  @Post(':id/share')
  @HttpCode(HttpStatus.OK)
  async share(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SharePostDto,
    @CurrentUser() user: any,
  ) {
    await this.postsService.incrementShareCount(id, dto.channel, user?.id);
    return { 
      message: 'Shared successfully',
      shareUrl: `https://inkstream.local/p/${id}` // placeholder as per brief 4.8
    };
  }

  @Get(':id/share-stats')
  @UseGuards(JwtAuthGuard)
  async getShareStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const post = await this.postsService.findOne(id);
    // Author or admin only
    if (user.role !== Role.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You do not have permission to view stats for this post');
    }
    return this.postsService.getShareStats(id);
  }
}
