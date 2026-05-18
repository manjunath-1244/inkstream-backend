import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostLike } from './entities/post-like.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { ForbiddenException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(PostLike)
    private readonly postLikeRepo: Repository<PostLike>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepo: Repository<CommentLike>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  async togglePostLike(userId: string, postId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, { where: { id: postId } });
      if (!post) throw new NotFoundException('Post not found');

      if (await this.usersService.isBlocked(userId, post.authorId)) {
        throw new ForbiddenException('You cannot interact with this user');
      }

      const existingLike = await manager.findOne(PostLike, {
        where: { userId, postId },
      });

      if (existingLike) {
        await manager.remove(existingLike);
        post.likeCount = Math.max(0, post.likeCount - 1);
        await manager.save(post);
        await this.redisService.invalidateByPattern('trending:*');
        return { liked: false, count: post.likeCount };
      } else {
        const newLike = manager.create(PostLike, { userId, postId });
        await manager.save(newLike);
        post.likeCount += 1;
        await manager.save(post);

        this.eventEmitter.emit('post.liked', {
          likerId: userId,
          authorId: post.authorId,
          postId: post.id,
        });

        await this.redisService.invalidateByPattern('trending:*');

        return { liked: true, count: post.likeCount };
      }
    });
  }

  async toggleCommentLike(userId: string, commentId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const comment = await manager.findOne(Comment, {
        where: { id: commentId },
      });
      if (!comment) throw new NotFoundException('Comment not found');

      if (await this.usersService.isBlocked(userId, comment.authorId)) {
        throw new ForbiddenException('You cannot interact with this user');
      }

      const existingLike = await manager.findOne(CommentLike, {
        where: { userId, commentId },
      });

      if (existingLike) {
        await manager.remove(existingLike);
        comment.likeCount = Math.max(0, comment.likeCount - 1);
        await manager.save(comment);
        return { liked: false, count: comment.likeCount };
      } else {
        const newLike = manager.create(CommentLike, { userId, commentId });
        await manager.save(newLike);
        comment.likeCount += 1;
        await manager.save(comment);
        return { liked: true, count: comment.likeCount };
      }
    });
  }

  async getPostLikes(postId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, total] = await this.postLikeRepo.findAndCount({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      items: items.map((i) => {
        const { passwordHash: _passwordHash, ...user } = i.user;

        return user;
      }),
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }
}
