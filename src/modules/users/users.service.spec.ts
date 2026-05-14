import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Role } from './entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

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

  describe('find methods', () => {
    it('findByEmail should call findOne', async () => {
      await service.findByEmail('test@test.com');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
    });

    it('findByUsername should call findOne', async () => {
      await service.findByUsername('testuser');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('findById should call findOne', async () => {
      await service.findById('1');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('findByResetToken should call findOne', async () => {
      await service.findByResetToken('token');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { resetPasswordToken: 'token' },
      });
    });
  });

  describe('update methods', () => {
    it('update should call update and findById', async () => {
      repo.findOne.mockResolvedValue({ id: '1', name: 'New' });
      const result = await service.update('1', { displayName: 'New' });
      expect(repo.update).toHaveBeenCalledWith('1', { displayName: 'New' });
      expect(result.name).toBe('New');
    });

    it('updateRole should call update and findById', async () => {
      repo.findOne.mockResolvedValue({ id: '1', role: Role.ADMIN });
      const result = await service.updateRole('1', Role.ADMIN);
      expect(repo.update).toHaveBeenCalledWith('1', { role: Role.ADMIN });
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  describe('follow', () => {
    it('should throw BadRequestException if following self', async () => {
      await expect(service.follow('1', '1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if target has blocked the user', async () => {
      const user = { id: '1', following: [] };
      const target = { id: '2', blockedUsers: [{ id: '1' }] };
      repo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(target);

      await expect(service.follow('1', '2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should not add to following if already following', async () => {
      const user = { id: '1', following: [{ id: '2' }] };
      const target = { id: '2', blockedUsers: [] };
      repo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(target);

      await service.follow('1', '2');
      expect(user.following).toHaveLength(1);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('unfollow', () => {
    it('should remove target from following list', async () => {
      const user = { id: '1', following: [{ id: '2' }] };
      repo.findOne.mockResolvedValue(user);
      await service.unfollow('1', '2');
      expect(user.following).toHaveLength(0);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.unfollow('1', '2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('block', () => {
    it('should throw BadRequestException if blocking self', async () => {
      await expect(service.block('1', '1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should add to blocked list and unfollow reciprocally', async () => {
      const user = { id: '1', blockedUsers: [], following: [{ id: '2' }] };
      const target = { id: '2', following: [{ id: '1' }] };
      repo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(target);

      await service.block('1', '2');
      expect(user.blockedUsers).toContain(target);
      expect(user.following).toHaveLength(0);
      expect(target.following).toHaveLength(0);
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('isBlocked', () => {
    it('should return true if A blocks B', async () => {
      const userA = { id: '1', blockedUsers: [{ id: '2' }] };
      const userB = { id: '2', blockedUsers: [] };
      repo.findOne.mockResolvedValueOnce(userA).mockResolvedValueOnce(userB);
      expect(await service.isBlocked('1', '2')).toBe(true);
    });

    it('should return true if B blocks A', async () => {
      const userA = { id: '1', blockedUsers: [] };
      const userB = { id: '2', blockedUsers: [{ id: '1' }] };
      repo.findOne.mockResolvedValueOnce(userA).mockResolvedValueOnce(userB);
      expect(await service.isBlocked('1', '2')).toBe(true);
    });

    it('should return false if no one blocks', async () => {
      const userA = { id: '1', blockedUsers: [] };
      const userB = { id: '2', blockedUsers: [] };
      repo.findOne.mockResolvedValueOnce(userA).mockResolvedValueOnce(userB);
      expect(await service.isBlocked('1', '2')).toBe(false);
    });
  });

  describe('getBlockedUserIds', () => {
    it('should return combined set of blocked IDs', async () => {
      const user = { id: '1', blockedUsers: [{ id: '2' }] };
      repo.findOne.mockResolvedValue(user);
      // createQueryBuilder is already mocked to return an object with getMany
      const result = await service.getBlockedUserIds('1');
      expect(result).toContain('2');
    });
  });

  describe('isFollowing', () => {
    it('should return following status', async () => {
      repo.findOne.mockResolvedValue({ id: '1', following: [{ id: '2' }] });
      const result = await service.isFollowing('1', '2');
      expect(result.following).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('should return null if user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      expect(await service.getProfile('none')).toBeNull();
    });

    it('should return profile with counts and without password', async () => {
      const user = {
        id: '1',
        username: 'test',
        passwordHash: 'hash',
        followers: [],
        following: [],
      };
      repo.findOne.mockResolvedValue(user);
      const result = await service.getProfile('test');
      expect(result.passwordHash).toBeUndefined();
      expect(result.followersCount).toBe(0);
    });
  });
});
