import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepo: any;
  let postRepo: any;
  let usersService: UsersService;

  const mockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softDelete: jest.fn(),
    update: jest.fn(),
    increment: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useFactory: mockRepo },
        { provide: getRepositoryToken(Post), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        {
          provide: UsersService,
          useValue: { isBlocked: jest.fn().mockResolvedValue(false) },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentRepo = module.get(getRepositoryToken(Comment));
    postRepo = module.get(getRepositoryToken(Post));
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should throw ForbiddenException if editing after 15 minutes', async () => {
      const createdAt = new Date(Date.now() - 20 * 60 * 1000); // 20 mins ago
      commentRepo.findOne.mockResolvedValue({ id: 'c1', authorId: 'u1', createdAt });
      
      await expect(service.update('c1', 'u1', { body: 'new' })).rejects.toThrow(ForbiddenException);
    });

    it('should update comment if within 15 minutes', async () => {
      const createdAt = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
      commentRepo.findOne.mockResolvedValue({ id: 'c1', authorId: 'u1', createdAt });
      
      await service.update('c1', 'u1', { body: 'new' });
      expect(commentRepo.save).toHaveBeenCalled();
    });
  });
});
