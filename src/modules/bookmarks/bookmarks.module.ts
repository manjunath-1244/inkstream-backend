import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarksService } from './bookmarks.service';
import { BookmarksController } from './bookmarks.controller';
import { Bookmark } from './entities/bookmark.entity';
import { Post } from '../posts/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, Post])],
  controllers: [BookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
