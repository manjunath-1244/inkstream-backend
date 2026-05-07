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
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  create(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.create(postId, user.id, dto);
  }

  @Public()
  @Get('posts/:postId/comments')
  findAll(
    @Param('postId') postId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.commentsService.findByPost(postId, paginationDto);
  }

  @Patch('comments/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.update(id, user.id, dto);
  }

  @Delete('comments/:id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentsService.remove(id, user);
  }
}
