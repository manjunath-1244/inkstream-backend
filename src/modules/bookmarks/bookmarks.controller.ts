import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':postId')
  toggle(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: any,
  ) {
    return this.bookmarksService.toggleBookmark(user.id, postId);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @CurrentUser() user: any) {
    return this.bookmarksService.getBookmarks(user.id, paginationDto);
  }
}
