import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Post, PostStatus } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Tag } from '../tags/entities/tag.entity';
import { Role } from '../users/entities/user.entity';
import { Share } from './entities/share.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PostLike } from '../likes/entities/post-like.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Share)
    private readonly shareRepository: Repository<Share>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private getBaseWhereClause(baseConditions: any = {}): any {
    return {
      ...baseConditions,
      status: PostStatus.PUBLISHED,
      isHidden: false,
    };
  }

  // Helper method to add blocked users filter
  private async getBlockedUsersCondition(userId?: string) {
    if (!userId) return {};

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
    });

    const blockers = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.blockedUsers', 'blocked')
      .where('blocked.id = :userId', { userId })
      .getMany();

    const blockedIds = new Set<string>();
    user?.blockedUsers?.forEach((u) => blockedIds.add(u.id));
    blockers?.forEach((u) => blockedIds.add(u.id));

    return blockedIds.size > 0
      ? { authorId: Not(In(Array.from(blockedIds))) }
      : {};
  }

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const { tagIds, ...postData } = createPostDto;

    const post = this.postRepository.create({
      ...postData,
      authorId,
    });

    if (tagIds && tagIds.length > 0) {
      post.tags = await this.tagRepository.find({
        where: { id: In(tagIds) },
      });
    }

    const savedPost = await this.postRepository.save(post);

    if (savedPost.status === PostStatus.PUBLISHED) {
      await this.notifyFollowers(savedPost);
    }

    return savedPost;
  }

  async findAll(paginationDto: PaginationDto, userId?: string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const blockFilter = await this.getBlockedUsersCondition(userId);

    const [items, total] = await this.postRepository.findAndCount({
      where: { ...this.getBaseWhereClause(), ...blockFilter },
      relations: ['author', 'category', 'tags'],
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

  async findOne(idOrSlug: string): Promise<Post> {
    const isUuid =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        idOrSlug,
      );

    const post = await this.postRepository.findOne({
      where: isUuid
        ? [
            { id: idOrSlug, isHidden: false },
            { slug: idOrSlug, isHidden: false },
          ]
        : { slug: idOrSlug, isHidden: false },
      relations: ['author', 'category', 'tags'],
    });

    if (!post) {
      throw new NotFoundException(`Post ${idOrSlug} not found`);
    }

    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    user: any,
  ): Promise<Post> {
    const post = await this.findOne(id);

    // Ownership check
    if (user.role !== Role.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this post',
      );
    }

    const { tagIds, ...postData } = updatePostDto;
    const oldStatus = post.status;
    Object.assign(post, postData);

    if (tagIds) {
      post.tags = await this.tagRepository.find({
        where: { id: In(tagIds) },
      });
    }

    const savedPost = await this.postRepository.save(post);

    // If it just became published
    if (
      updatePostDto.status === PostStatus.PUBLISHED &&
      oldStatus !== PostStatus.PUBLISHED
    ) {
      await this.notifyFollowers(savedPost);
    }

    return savedPost;
  }

  private async notifyFollowers(post: Post) {
    const author = await this.userRepository.findOne({
      where: { id: post.authorId },
      relations: ['followers'],
    });

    if (author && author.followers.length > 0) {
      this.eventEmitter.emit('post.published', {
        authorId: post.authorId,
        postId: post.id,
        followerIds: author.followers.map((f) => f.id),
      });
    }
  }

  async remove(id: string, user: any): Promise<void> {
    const post = await this.findOne(id);

    // Ownership check
    if (user.role !== Role.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this post',
      );
    }

    await this.postRepository.softDelete(id);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.postRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementShareCount(
    id: string,
    channel: string,
    userId?: string,
  ): Promise<void> {
    const post = await this.findOne(id);

    // 1. Record the share event
    const share = this.shareRepository.create({
      postId: post.id,
      userId,
      channel,
    });
    await this.shareRepository.save(share);

    // 2. Increment the aggregate counter
    await this.postRepository.increment({ id: post.id }, 'shareCount', 1);
  }

  async getShareStats(postId: string) {
    const stats = await this.shareRepository
      .createQueryBuilder('share')
      .select('share.channel', 'channel')
      .addSelect('COUNT(*)', 'count')
      .where('share.postId = :postId', { postId })
      .groupBy('share.channel')
      .getRawMany();

    return stats.map((s) => ({
      channel: s.channel,
      count: parseInt(s.count, 10),
    }));
  }

  async findMyDrafts(authorId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, total] = await this.postRepository.findAndCount({
      where: { authorId, status: PostStatus.DRAFT },
      relations: ['category', 'tags'],
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

  async findByUser(userId: string, paginationDto: PaginationDto) {
    // ...
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, total] = await this.postRepository.findAndCount({
      where: { authorId: userId, status: PostStatus.PUBLISHED },
      relations: ['category', 'tags'],
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

  async getFeed(userId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // 1. Get the list of users that the current user follows
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user || user.following.length === 0) {
      return {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: limit,
          totalPages: 0,
          currentPage: page,
        },
      };
    }

    const followedIds = user.following.map((u) => u.id);

    // 2. Fetch posts from those users
    const blockFilter = await this.getBlockedUsersCondition(userId);
    const [items, total] = await this.postRepository.findAndCount({
      where: {
        authorId: In(followedIds),
        ...this.getBaseWhereClause(),
        ...blockFilter,
      },
      relations: ['author', 'category', 'tags'],
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

  async getTrending(paginationDto: PaginationDto, userId?: string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(pl.id)', 'recentLikes')
          .from(PostLike, 'pl')
          .where('pl.postId = post.id')
          .andWhere('pl.createdAt >= :sevenDaysAgo', { sevenDaysAgo });
      }, 'recentLikes')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(c.id)', 'recentComments')
          .from(Comment, 'c')
          .where('c.postId = post.id')
          .andWhere('c.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
          .andWhere('c.deletedAt IS NULL');
      }, 'recentComments')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(s.id)', 'recentShares')
          .from(Share, 's')
          .where('s.postId = post.id')
          .andWhere('s.createdAt >= :sevenDaysAgo', { sevenDaysAgo });
      }, 'recentShares')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.isHidden = :isHidden', { isHidden: false });

    if (userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['blockedUsers'],
      });
      const blockers = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.blockedUsers', 'blocked')
        .where('blocked.id = :userId', { userId })
        .getMany();

      const blockedIds = new Set<string>();
      user?.blockedUsers.forEach((u) => blockedIds.add(u.id));
      blockers.forEach((u) => blockedIds.add(u.id));
      const blockedIdsArray = Array.from(blockedIds);

      if (blockedIdsArray.length > 0) {
        queryBuilder.andWhere('post.authorId NOT IN (:...blockedIds)', {
          blockedIds: blockedIdsArray,
        });
      }
    }

    queryBuilder
      .orderBy(
        '( (SELECT COUNT(*) FROM post_likes WHERE "postId" = post.id AND "createdAt" >= :sevenDaysAgo) * 3 + (SELECT COUNT(*) FROM comments WHERE "postId" = post.id AND "createdAt" >= :sevenDaysAgo AND "deletedAt" IS NULL) * 2 + (SELECT COUNT(*) FROM shares WHERE "postId" = post.id AND "createdAt" >= :sevenDaysAgo) * 4 )',
        'DESC',
      )
      .addOrderBy('post.createdAt', 'DESC')
      .setParameters({
        sevenDaysAgo,
        status: PostStatus.PUBLISHED,
        isHidden: false,
      })
      .take(limit)
      .skip(skip);

    // We use getManyAndCount but since we need the score for ordering,
    // the queryBuilder.orderBy already handles it in SQL.
    const [items, total] = await queryBuilder.getManyAndCount();

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

  async findByTag(
    tagId: string,
    paginationDto: PaginationDto,
    userId?: string,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    await this.getBlockedUsersCondition(userId);

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('tags.id = :tagId', { tagId })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.isHidden = :isHidden', { isHidden: false });

    if (userId) {
      const blockFilter = await this.getBlockedUsersCondition(userId);
      if (blockFilter.authorId) {
        queryBuilder.andWhere('post.authorId NOT IN (:...blockedIds)', {
          blockedIds: (blockFilter.authorId as any)._value,
        });
      }
    }

    const [items, total] = await queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .take(limit)
      .skip(skip)
      .getManyAndCount();

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

  async searchPosts(q: string, paginationDto: PaginationDto, userId?: string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.isHidden = :isHidden', { isHidden: false });

    if (userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['blockedUsers'],
      });
      const blockers = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.blockedUsers', 'blocked')
        .where('blocked.id = :userId', { userId })
        .getMany();

      const blockedIds = new Set<string>();
      user?.blockedUsers.forEach((u) => blockedIds.add(u.id));
      blockers.forEach((u) => blockedIds.add(u.id));
      const blockedIdsArray = Array.from(blockedIds);

      if (blockedIdsArray.length > 0) {
        queryBuilder.andWhere('post.authorId NOT IN (:...blockedIds)', {
          blockedIds: blockedIdsArray,
        });
      }
    }

    queryBuilder
      .andWhere(
        new Brackets((qb) => {
          qb.where('post.title ILIKE :q', { q: `%${q}%` })
            .orWhere('post.contentMarkdown ILIKE :q', { q: `%${q}%` })
            .orWhere('tags.name ILIKE :q', { q: `%${q}%` });
        }),
      )
      .orderBy('post.createdAt', 'DESC')
      .take(limit)
      .skip(skip);

    const [items, total] = await queryBuilder.getManyAndCount();

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
}
