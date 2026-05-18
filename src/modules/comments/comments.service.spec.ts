import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { User, Role } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

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
    decrement: jest.fn(),
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
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            invalidateByPattern: jest.fn(),
          },
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

  describe('create', () => {
    it('should throw NotFoundException if post not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create('p1', 'u1', { body: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is blocked', async () => {
      postRepo.findOne.mockResolvedValue({ id: 'p1', authorId: 'pauthor' });
      (usersService.isBlocked as jest.Mock).mockResolvedValue(true);
      await expect(
        service.create('p1', 'u1', { body: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create a top-level comment', async () => {
      const post = { id: 'p1', authorId: 'pauthor' };
      postRepo.findOne.mockResolvedValue(post);
      commentRepo.create.mockReturnValue({ body: 'test' });
      commentRepo.save.mockResolvedValue({ id: 'c1', body: 'test' });

      const result = await service.create('p1', 'u1', { body: 'test' });
      expect(commentRepo.create).toHaveBeenCalled();
      expect(postRepo.increment).toHaveBeenCalled();
      expect(result.id).toBe('c1');
    });

    it('should handle nesting depth (reply to a reply becomes sibling)', async () => {
      const post = { id: 'p1', authorId: 'pauthor' };
      const parent = {
        id: 'parent',
        authorId: 'u2',
        parentCommentId: 'grandparent',
      };
      postRepo.findOne.mockResolvedValue(post);
      commentRepo.findOne.mockResolvedValue(parent);
      commentRepo.create.mockReturnValue({ body: 'reply' });
      commentRepo.save.mockResolvedValue({ id: 'c2' });

      await service.create('p1', 'u1', {
        body: 'reply',
        parentCommentId: 'parent',
      });
      expect(commentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentCommentId: 'grandparent',
        }),
      );
    });
  });

  describe('findByPost', () => {
    it('should return paginated comments', async () => {
      const items = [{ id: 'c1' }];
      commentRepo.findAndCount.mockResolvedValue([items, 1]);
      const result = await service.findByPost('p1', { page: 1, limit: 10 });
      expect(result.items).toEqual(items);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if editing after 15 minutes', async () => {
      const createdAt = new Date(Date.now() - 20 * 60 * 1000); // 20 mins ago
      commentRepo.findOne.mockResolvedValue({
        id: 'c1',
        authorId: 'u1',
        createdAt,
      });

      await expect(service.update('c1', 'u1', { body: 'new' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should update comment if within 15 minutes', async () => {
      const createdAt = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
      commentRepo.findOne.mockResolvedValue({
        id: 'c1',
        authorId: 'u1',
        createdAt,
      });

      await service.update('c1', 'u1', { body: 'new' });
      expect(commentRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete if owner', async () => {
      const comment = { id: 'c1', authorId: 'u1', post: { authorId: 'u2' } };
      commentRepo.findOne.mockResolvedValue(comment);
      await service.remove('c1', { id: 'u1', role: Role.USER });
      expect(commentRepo.softDelete).toHaveBeenCalledWith('c1');
    });

    it('should soft delete if post author', async () => {
      const comment = { id: 'c1', authorId: 'u1', post: { authorId: 'u2' } };
      commentRepo.findOne.mockResolvedValue(comment);
      await service.remove('c1', { id: 'u2', role: Role.USER });
      expect(commentRepo.softDelete).toHaveBeenCalledWith('c1');
    });

    it('should throw ForbiddenException if no permission', async () => {
      const comment = { id: 'c1', authorId: 'u1', post: { authorId: 'u2' } };
      commentRepo.findOne.mockResolvedValue(comment);
      await expect(
        service.remove('c1', { id: 'u3', role: Role.USER }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
