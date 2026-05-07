import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { FeedController } from './feed.controller';
import { Post } from './entities/post.entity';
import { Tag } from '../tags/entities/tag.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag, User])],
  controllers: [PostsController, FeedController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
