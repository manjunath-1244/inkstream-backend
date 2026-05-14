import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Role } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
  ) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (await this.usersService.isBlocked(authorId, post.authorId)) {
      throw new ForbiddenException('You cannot interact with this user');
    }

    let parentCommentId = dto.parentCommentId;

    if (parentCommentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: parentCommentId },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');

      if (await this.usersService.isBlocked(authorId, parent.authorId)) {
        throw new ForbiddenException('You cannot interact with this user');
      }

      // Rule: Reply to a reply becomes a sibling reply on the same parent
      // This enforces a 1-level nesting depth
      if (parent.parentCommentId) {
        parentCommentId = parent.parentCommentId;
      }
    }

    const comment = this.commentRepo.create({
      body: dto.body,
      postId,
      authorId,
      parentCommentId,
    });

    const savedComment = await this.commentRepo.save(comment);
    await this.postRepo.increment({ id: postId }, 'commentCount', 1);

    if (parentCommentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: parentCommentId },
      });
      if (parent) {
        this.eventEmitter.emit('comment.replied', {
          replierId: authorId,
          parentCommentAuthorId: parent.authorId,
          postId: postId,
          commentId: savedComment.id,
        });
      }
    } else if (post) {
      this.eventEmitter.emit('comment.created', {
        commenterId: authorId,
        postAuthorId: post.authorId,
        postId: postId,
        commentId: savedComment.id,
      });
    }

    return savedComment;
  }

  async findByPost(postId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Fetch top-level comments with their replies (paginated)
    const [items, total] = await this.commentRepo.findAndCount({
      where: { postId, parentCommentId: IsNull() },
      relations: ['author', 'replies', 'replies.author'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async update(id: string, authorId: string, dto: UpdateCommentDto) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');

    // Ownership check
    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Rule: Edits forbidden after 15 minutes
    const fifteenMinutesInMs = 15 * 60 * 1000;
    const timeElapsed = Date.now() - comment.createdAt.getTime();

    if (timeElapsed > fifteenMinutesInMs) {
      throw new ForbiddenException(
        'Comments cannot be edited after 15 minutes',
      );
    }

    comment.body = dto.body;
    return this.commentRepo.save(comment);
  }

  async remove(id: string, user: any) {
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['post'],
    });
    if (!comment) throw new NotFoundException('Comment not found');

    // Rule: Owner, post author, moderator, or admin can delete
    const isOwner = comment.authorId === user.id;
    const isPostAuthor = comment.post.authorId === user.id;
    const isModOrAdmin = [Role.MODERATOR, Role.ADMIN].includes(user.role);

    if (!isOwner && !isPostAuthor && !isModOrAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    await this.commentRepo.softDelete(id);
    await this.postRepo.decrement({ id: comment.postId }, 'commentCount', 1);
  }
}
