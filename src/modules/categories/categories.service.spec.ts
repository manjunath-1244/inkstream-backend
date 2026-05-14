import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: any;

  const mockCategoryRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useFactory: mockCategoryRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repo = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call repo.find', async () => {
      await service.findAll();
      expect(repo.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if category not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('none')).rejects.toThrow(NotFoundException);
    });

    it('should find category by ID or slug', async () => {
      const cat = { id: '1', name: 'Tech' };
      repo.findOne.mockResolvedValue(cat);
      expect(await service.findOne('1')).toEqual(cat);
    });
  });
  describe('create', () => {
    it('should create and save a category', async () => {
      const dto = { name: 'Tech', slug: 'tech' };
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(dto);
      repo.save.mockResolvedValue({ id: '1', ...dto });
      const result = await service.create(dto);
      expect(result.id).toBe('1');
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if category already exists', async () => {
      const dto = { name: 'Tech', slug: 'tech' };
      repo.findOne.mockResolvedValue({ id: '1', ...dto });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
