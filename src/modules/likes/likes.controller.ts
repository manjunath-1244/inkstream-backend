import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Likes')
@Controller()
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('posts/:id/like')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOkResponse({ description: 'Returns like status (liked or unliked)' })
  togglePostLike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.likesService.togglePostLike(user.id, id);
  }

  @Post('comments/:id/like')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiOkResponse({ description: 'Returns like status (liked or unliked)' })
  toggleCommentLike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.likesService.toggleCommentLike(user.id, id);
  }

  @Public()
  @Get('posts/:id/likes')
  @ApiOperation({ summary: 'Get all likes for a post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOkResponse({
    description: 'Returns paginated list of users who liked the post',
  })
  getPostLikes(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.likesService.getPostLikes(id, paginationDto);
  }
}
