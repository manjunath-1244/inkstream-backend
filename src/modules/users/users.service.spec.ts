import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Role } from './entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repo: any;

  const mockUserRepo = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('follow', () => {
    it('should throw BadRequestException if following self', async () => {
      await expect(service.follow('1', '1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user or target not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.follow('1', '2')).rejects.toThrow(NotFoundException);
    });

    it('should add target to following list', async () => {
      const user = { id: '1', following: [] };
      const target = { id: '2', blockedUsers: [] };
      repo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(target);
      
      await service.follow('1', '2');
      expect(user.following).toContain(target);
      expect(repo.save).toHaveBeenCalledWith(user);
    });
  });

  describe('block', () => {
    it('should add user to blocked list and unfollow', async () => {
      const user = { id: '1', blockedUsers: [], following: [{ id: '2' }] };
      const target = { id: '2', following: [{ id: '1' }] };
      repo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(target);

      await service.block('1', '2');
      expect(user.blockedUsers).toContain(target);
      expect(user.following).toHaveLength(0);
      expect(target.following).toHaveLength(0);
    });
  });
});
