import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { Post } from '../posts/entities/post.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepo: Repository<Bookmark>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async toggleBookmark(userId: string, postId: string) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.bookmarkRepo.findOne({
      where: { userId, postId },
    });

    if (existing) {
      await this.bookmarkRepo.remove(existing);
      return { bookmarked: false };
    } else {
      const bookmark = this.bookmarkRepo.create({ userId, postId });
      await this.bookmarkRepo.save(bookmark);
      return { bookmarked: true };
    }
  }

  async getBookmarks(userId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, total] = await this.bookmarkRepo.findAndCount({
      where: { userId },
      relations: ['post', 'post.author', 'post.category', 'post.tags'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      items: items.map((i) => i.post),
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
