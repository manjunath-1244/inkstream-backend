import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let refreshTokenRepo: any;

  const mockRefreshTokenRepo = {
    save: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockReturnValue({}),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  };

  const mockUsersService = () => ({
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useFactory: mockUsersService },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_token'),
            verify: jest.fn().mockReturnValue({ sub: '1' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('7d'),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepo,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens for a validated user', async () => {
      const user = { id: '1', email: 't@t.com', username: 'u', role: 'USER' };
      
      const result = await service.login(user);
      expect(result).toHaveProperty('accessToken');
      expect(result.user.id).toBe('1');
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if token not found', async () => {
      refreshTokenRepo.find.mockResolvedValue([]);
      await expect(service.refreshTokens('invalid')).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens if valid refresh token', async () => {
      const tokenObj = { tokenHash: 'hashed', userId: '1', expiresAt: new Date(Date.now() + 10000) };
      refreshTokenRepo.find.mockResolvedValue([tokenObj]);
      jest.spyOn(usersService, 'findById').mockResolvedValue({ id: '1', email: 't@t.com' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refreshTokens('valid');
      expect(result).toHaveProperty('accessToken');
    });
  });
});
