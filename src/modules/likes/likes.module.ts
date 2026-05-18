import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { PostLike } from './entities/post-like.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostLike, CommentLike, Post, Comment]),
    UsersModule,
    RedisModule,
  ],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
