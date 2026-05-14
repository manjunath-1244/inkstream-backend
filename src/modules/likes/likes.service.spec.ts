import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from './likes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostLike } from './entities/post-like.entity';
import { CommentLike } from './entities/comment-like.entity';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';
import { NotFoundException } from '@nestjs/common';

describe('LikesService', () => {
  let service: LikesService;
  let postLikeRepo: any;
  let _dataSource: any;
  let _usersService: UsersService;

  const mockManager = {
    findOne: jest.fn(),
    save: jest.fn(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    create: jest.fn().mockImplementation((_cls, data) => data),
    remove: jest.fn(),
  };

  const mockRepo = () => ({
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  });

  const mockDataSource = () => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    transaction: jest.fn((cb) => cb(mockManager)),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: getRepositoryToken(PostLike), useFactory: mockRepo },
        { provide: getRepositoryToken(CommentLike), useFactory: mockRepo },
        { provide: DataSource, useFactory: mockDataSource },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { isBlocked: jest.fn().mockResolvedValue(false) },
        },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
    postLikeRepo = module.get(getRepositoryToken(PostLike));
    _dataSource = module.get(DataSource);
    _usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('togglePostLike', () => {
    it('should throw NotFoundException if post missing', async () => {
      mockManager.findOne.mockResolvedValue(null);
      await expect(service.togglePostLike('u1', 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should like a post if not liked', async () => {
      const post = { id: 'p1', authorId: 'a1', likeCount: 0 };
      mockManager.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(null); // No existing like

      const result = await service.togglePostLike('u1', 'p1');
      expect(result.liked).toBe(true);
      expect(result.count).toBe(1);
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1' }),
      );
    });

    it('should unlike a post if already liked', async () => {
      const post = { id: 'p1', authorId: 'a1', likeCount: 1 };
      const like = { id: 'l1', userId: 'u1', postId: 'p1' };
      mockManager.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(like);

      const result = await service.togglePostLike('u1', 'p1');
      expect(result.liked).toBe(false);
      expect(result.count).toBe(0);
      expect(mockManager.remove).toHaveBeenCalled();
    });
  });

  describe('toggleCommentLike', () => {
    it('should like a comment if not liked', async () => {
      const comment = { id: 'c1', authorId: 'a1', likeCount: 0 };
      mockManager.findOne
        .mockResolvedValueOnce(comment)
        .mockResolvedValueOnce(null);

      const result = await service.toggleCommentLike('u1', 'c1');
      expect(result.liked).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  describe('getPostLikes', () => {
    it('should return paginated post likes', async () => {
      const items = [{ user: { id: 'u1', email: 't@t.com' } }];
      postLikeRepo.findAndCount.mockResolvedValue([items, 1]);

      const result = await service.getPostLikes('p1', { page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(postLikeRepo.findAndCount).toHaveBeenCalled();
    });
  });
});
