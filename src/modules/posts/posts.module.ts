import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { FeedController } from './feed.controller';
import { Post } from './entities/post.entity';
import { Tag } from '../tags/entities/tag.entity';
import { User } from '../users/entities/user.entity';
import { Share } from './entities/share.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PostLike } from '../likes/entities/post-like.entity';
import { RedisModule } from '../redis/redis.module';
import { PostsResolver } from './posts.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Tag, User, Share, Comment, PostLike]),
    RedisModule,
  ],
  controllers: [PostsController, FeedController],
  providers: [PostsService, PostsResolver],
  exports: [PostsService],
})
export class PostsModule {}
