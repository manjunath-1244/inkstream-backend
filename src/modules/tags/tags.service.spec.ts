import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { PostsService } from '../posts/posts.service';
import { UsersService } from '../users/users.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TagsService', () => {
  let service: TagsService;
  let repo: any;

  const mockTagRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: getRepositoryToken(Tag), useFactory: mockTagRepo },
        {
          provide: PostsService,
          useValue: { findByTag: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    repo = module.get(getRepositoryToken(Tag));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call queryBuilder to get tags with counts', async () => {
      await service.findAll();
      expect(repo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if tag missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('should return tag if found', async () => {
      const tag = { id: '1', name: 'tech' };
      repo.findOne.mockResolvedValue(tag);
      expect(await service.findOne('1')).toEqual(tag);
    });
  });

  describe('findBySlug', () => {
    it('should return tag if found by slug', async () => {
      const tag = { id: '1', name: 'tech', slug: 'tech' };
      repo.findOne.mockResolvedValue(tag);
      expect(await service.findBySlug('tech')).toEqual(tag);
    });
  });

  describe('create', () => {
    it('should throw ConflictException if tag exists', async () => {
      repo.findOne.mockResolvedValue({ id: '1' });
      await expect(service.create({ name: 'tech' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create new tag', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ name: 'tech' });
      repo.save.mockResolvedValue({ id: '1', name: 'tech' });
      const result = await service.create({ name: 'tech' });
      expect(result.id).toBe('1');
    });
  });

  describe('findOrCreate', () => {
    it('should return existing tag if found', async () => {
      const tag = { id: '1', slug: 'tech' };
      repo.findOne.mockResolvedValue(tag);
      expect(await service.findOrCreate('tech')).toEqual(tag);
    });

    it('should create new tag if not found', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ name: 'tech', slug: 'tech' });
      repo.save.mockResolvedValue({ id: '1', name: 'tech', slug: 'tech' });
      const result = await service.findOrCreate('tech');
      expect(result.id).toBe('1');
    });
  });
});
