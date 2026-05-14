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
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Comment } from './entities/comment.entity';

@ApiTags('Comments')
@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a comment on a post' })
  @ApiParam({ name: 'postId', description: 'Post UUID' })
  @ApiCreatedResponse({
    type: Comment,
    description: 'Comment created successfully',
  })
  create(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.create(postId, user.id, dto);
  }

  @Public()
  @Get('posts/:postId/comments')
  @ApiOperation({ summary: 'Get all comments for a post' })
  @ApiParam({ name: 'postId', description: 'Post UUID' })
  @ApiOkResponse({ description: 'Returns paginated list of comments' })
  findAll(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.commentsService.findByPost(postId, paginationDto);
  }

  @Patch('comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiOkResponse({ type: Comment, description: 'Comment updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.update(id, user.id, dto);
  }

  @Delete('comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiOkResponse({ description: 'Comment deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.commentsService.remove(id, user);
  }
}
