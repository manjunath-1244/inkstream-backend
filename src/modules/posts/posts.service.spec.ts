import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post, PostStatus, PostVisibility } from './entities/post.entity';
import { Tag } from '../tags/entities/tag.entity';
import { User } from '../users/entities/user.entity';
import { Share } from './entities/share.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PostLike } from '../likes/entities/post-like.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: any;

  const mockPostRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  });

  const mockOtherRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a post', async () => {
      const dto = { title: 'Test', contentMarkdown: 'Content', status: PostStatus.PUBLISHED };
      const authorId = 'author-id';
      postRepo.create.mockReturnValue({ ...dto, authorId });
      postRepo.save.mockResolvedValue({ id: 'post-id', ...dto, authorId });

      const result = await service.create(dto as any, authorId);
      expect(postRepo.create).toHaveBeenCalled();
      expect(postRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('post-id');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if post not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('should return the post if found', async () => {
      const post = { id: '1', slug: 'test' };
      postRepo.findOne.mockResolvedValue(post);
      const result = await service.findOne('test');
      expect(result).toEqual(post);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if not owner or admin', async () => {
      const post = { id: '1', authorId: 'owner' };
      postRepo.findOne.mockResolvedValue(post);
      const user = { id: 'other', role: 'USER' };
      
      await expect(service.update('1', {}, user as any)).rejects.toThrow(ForbiddenException);
    });

    it('should update post if owner', async () => {
      const post = { id: '1', authorId: 'owner', isHidden: false };
      postRepo.findOne.mockResolvedValue(post);
      const user = { id: 'owner', role: 'USER' };
      
      await service.update('1', { title: 'New' }, user as any);
      expect(postRepo.save).toHaveBeenCalled();
    });
  });

  describe('getTrending', () => {
    it('should return trending posts', async () => {
      const items = [{ id: '1', title: 'Trending' }];
      const qb = postRepo.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([items, 1]);

      const result = await service.getTrending({ page: 1, limit: 10 });
      expect(result.items).toEqual(items);
      expect(qb.getManyAndCount).toHaveBeenCalled();
    });
  });

  describe('searchPosts', () => {
    it('should return search results', async () => {
      const items = [{ id: '1', title: 'Search Result' }];
      const qb = postRepo.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([items, 1]);

      const result = await service.searchPosts('query', { page: 1, limit: 10 });
      expect(result.items).toEqual(items);
    });
  });
});
