import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post, PostStatus } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Tag } from '../tags/entities/tag.entity';
import { Role } from '../users/entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

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

    return this.postRepository.save(post);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, total] = await this.postRepository.findAndCount({
      where: { status: PostStatus.PUBLISHED },
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
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrSlug);
    
    const post = await this.postRepository.findOne({
      where: isUuid 
        ? [{ id: idOrSlug }, { slug: idOrSlug }] 
        : { slug: idOrSlug },
      relations: ['author', 'category', 'tags'],
    });

    if (!post) {
      throw new NotFoundException(`Post ${idOrSlug} not found`);
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, user: any): Promise<Post> {
    const post = await this.findOne(id);

    // Ownership check
    if (user.role !== Role.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You do not have permission to update this post');
    }

    const { tagIds, ...postData } = updatePostDto;
    Object.assign(post, postData);

    if (tagIds) {
      post.tags = await this.tagRepository.find({
        where: { id: In(tagIds) },
      });
    }

    return this.postRepository.save(post);
  }

  async remove(id: string, user: any): Promise<void> {
    const post = await this.findOne(id);

    // Ownership check
    if (user.role !== Role.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }

    await this.postRepository.remove(post);
  }

  async findByUser(userId: string, paginationDto: PaginationDto) {
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
}
