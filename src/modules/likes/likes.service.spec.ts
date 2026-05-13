import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from './likes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostLike } from './entities/post-like.entity';
import { CommentLike } from './entities/comment-like.entity';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';

describe('LikesService', () => {
  let service: LikesService;
  let postLikeRepo: any;

  const mockRepo = () => ({
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  });

  const mockDataSource = () => ({
    transaction: jest.fn(cb => cb({
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    })),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
