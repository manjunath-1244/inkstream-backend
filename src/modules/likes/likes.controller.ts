import { Controller, Post, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('posts/:id/like')
  togglePostLike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.likesService.togglePostLike(user.id, id);
  }

  @Post('comments/:id/like')
  toggleCommentLike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.likesService.toggleCommentLike(user.id, id);
  }

  @Public()
  @Get('posts/:id/likes')
  getPostLikes(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.likesService.getPostLikes(id, paginationDto);
  }

  // if we want comment likes count we can add here

  // @Public()
  // @Get('comments/:id/likes')
  // getCommentLikes(
  //   @Param('id') id: string,
  //   @Query() paginationDto: PaginationDto,
  // ) {
  //   return this.likesService.getCommentLikes(id, paginationDto);
  // }
}
