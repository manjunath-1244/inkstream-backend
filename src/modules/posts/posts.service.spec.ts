import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post, PostStatus } from './entities/post.entity';
import { Tag } from '../tags/entities/tag.entity';
import { User, Role } from '../users/entities/user.entity';
import { Share } from './entities/share.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PostLike } from '../likes/entities/post-like.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForbiddenException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: any;
  let userRepo: any;
  let tagRepo: any;
  let _shareRepo: any;
  let _eventEmitter: any;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const mockPostRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    update: jest.fn(),
    softDelete: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  });

  const mockOtherRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useFactory: mockPostRepo },
        { provide: getRepositoryToken(Tag), useFactory: mockOtherRepo },
        { provide: getRepositoryToken(User), useFactory: mockOtherRepo },
        { provide: getRepositoryToken(Share), useFactory: mockOtherRepo },
        { provide: getRepositoryToken(Comment), useFactory: mockOtherRepo },
        { provide: getRepositoryToken(PostLike), useFactory: mockOtherRepo },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepo = module.get(getRepositoryToken(Post));
    userRepo = module.get(getRepositoryToken(User));
    tagRepo = module.get(getRepositoryToken(Tag));
    _shareRepo = module.get(getRepositoryToken(Share));
    _eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a post', async () => {
      const dto = {
        title: 'Test',
        contentMarkdown: 'Content',
        status: PostStatus.PUBLISHED,
        tagIds: ['1'],
      };
      const authorId = 'author-id';
      postRepo.create.mockReturnValue({ ...dto, authorId });
      postRepo.save.mockResolvedValue({ id: 'post-id', ...dto, authorId });
      tagRepo.find.mockResolvedValue([{ id: '1', name: 'tag' }]);

      const result = await service.create(dto, authorId);
      expect(postRepo.create).toHaveBeenCalled();
      expect(postRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('post-id');
    });
  });

  describe('findAll', () => {
    it('should return paginated posts and apply block filters', async () => {
      const items = [{ id: '1', title: 'Post' }];
      postRepo.findAndCount.mockResolvedValue([items, 1]);
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        blockedUsers: [{ id: 'blocked-id' }],
      });
      mockQueryBuilder.getMany.mockResolvedValue([]); // For blockers query

      const result = await service.findAll({ page: 1, limit: 10 }, 'u1');
      expect(result.items).toEqual(items);
      expect(postRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: expect.anything(),
          }),
        }),
      );
    });
  });

  describe('getFeed', () => {
    it('should return empty items if user follows no one', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', following: [] });
      const result = await service.getFeed('u1', { page: 1, limit: 10 });
      expect(result.items).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });

    it('should return posts from followed users', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        following: [{ id: 'f1' }],
        blockedUsers: [],
      });
      mockQueryBuilder.getMany.mockResolvedValue([]);
      postRepo.findAndCount.mockResolvedValue([[{ id: 'p1' }], 1]);

      const result = await service.getFeed('u1', { page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(postRepo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('getTrending', () => {
    it('should build a complex trending query', async () => {
      postRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 'p1' }], 1]);

      const result = await service.getTrending({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledTimes(3);
    });

    it('should apply block filters in trending if userId provided', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        blockedUsers: [{ id: 'b1' }],
      });
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getTrending({ page: 1, limit: 10 }, 'u1');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('authorId NOT IN'),
        expect.any(Object),
      );
    });
  });

  describe('searchPosts', () => {
    it('should search posts with keyword and block filters', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', blockedUsers: [] });
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 'p1' }], 1]);

      const result = await service.searchPosts(
        'nest',
        { page: 1, limit: 10 },
        'u1',
      );
      expect(result.items).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findByTag', () => {
    it('should filter posts by tag ID', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 'p1' }], 1]);
      const result = await service.findByTag('t1', { page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('tags.id = :tagId', {
        tagId: 't1',
      });
    });
  });

  describe('remove', () => {
    it('should soft delete post if user is owner', async () => {
      const post = { id: 'p1', authorId: 'u1' };
      postRepo.findOne.mockResolvedValue(post);
      await service.remove('p1', { id: 'u1', role: Role.USER });
      expect(postRepo.softDelete).toHaveBeenCalledWith('p1');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const post = { id: 'p1', authorId: 'u1' };
      postRepo.findOne.mockResolvedValue(post);
      await expect(
        service.remove('p1', { id: 'u2', role: Role.USER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to delete any post', async () => {
      const post = { id: 'p1', authorId: 'u1' };
      postRepo.findOne.mockResolvedValue(post);
      await service.remove('p1', { id: 'admin-id', role: Role.ADMIN });
      expect(postRepo.softDelete).toHaveBeenCalledWith('p1');
    });
  });
});
