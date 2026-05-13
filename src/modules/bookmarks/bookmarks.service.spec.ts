import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksService } from './bookmarks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { Post } from '../posts/entities/post.entity';
import { NotFoundException } from '@nestjs/common';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let bookmarkRepo: any;
  let postRepo: any;

  const mockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: getRepositoryToken(Bookmark), useFactory: mockRepo },
        { provide: getRepositoryToken(Post), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
    bookmarkRepo = module.get(getRepositoryToken(Bookmark));
    postRepo = module.get(getRepositoryToken(Post));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toggleBookmark', () => {
    it('should throw NotFoundException if post missing', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleBookmark('u1', 'p1')).rejects.toThrow(NotFoundException);
    });

    it('should remove bookmark if exists', async () => {
      postRepo.findOne.mockResolvedValue({ id: 'p1' });
      const bookmark = { id: 'b1' };
      bookmarkRepo.findOne.mockResolvedValue(bookmark);
      
      const result = await service.toggleBookmark('u1', 'p1');
      expect(bookmarkRepo.remove).toHaveBeenCalledWith(bookmark);
      expect(result.bookmarked).toBe(false);
    });

    it('should create bookmark if not exists', async () => {
      postRepo.findOne.mockResolvedValue({ id: 'p1' });
      bookmarkRepo.findOne.mockResolvedValue(null);
      
      const result = await service.toggleBookmark('u1', 'p1');
      expect(bookmarkRepo.save).toHaveBeenCalled();
      expect(result.bookmarked).toBe(true);
    });
  });
});
