import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

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
    findByResetToken: jest.fn(),
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
        {
          provide: MailService,
          useValue: { sendForgotPasswordEmail: jest.fn(), sendEmail: jest.fn() },
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

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue({ id: '1' } as any);
      await expect(
        service.register({
          email: 't@t.com',
          password: 'p',
          displayName: 'u',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(usersService, 'create')
        .mockResolvedValue({ id: '1', email: 't@t.com' } as any);
      const result = await service.register({
        email: 't@t.com',
        password: 'p',
        displayName: 'u',
      });
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('validateUser', () => {
    it('should return user if password matches', async () => {
      const user = {
        id: '1',
        email: 't@t.com',
        passwordHash: 'hashed',
        status: 'ACTIVE',
      };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validateUser('t@t.com', 'pass');
      expect(result.id).toBe('1');
    });

    it('should return null if password mismatch', async () => {
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue({ passwordHash: 'h' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      expect(await service.validateUser('t@t.com', 'p')).toBeNull();
    });
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
      await expect(service.refreshTokens('invalid')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens if valid refresh token', async () => {
      const tokenObj = {
        tokenHash: 'hashed',
        userId: '1',
        expiresAt: new Date(Date.now() + 10000),
      };
      refreshTokenRepo.find.mockResolvedValue([tokenObj]);
      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue({ id: '1', email: 't@t.com' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refreshTokens('valid');
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('forgotPassword', () => {
    it('should return generic message even if user not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      const result = await service.forgotPassword('missing@t.com');
      expect(result.message).toContain('receive a reset link');
    });

    it('should update user with reset token', async () => {
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue({ id: '1' } as any);
      await service.forgotPassword('t@t.com');
      expect(usersService.update).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw UnauthorizedException if token invalid', async () => {
      jest.spyOn(usersService, 'findByResetToken').mockResolvedValue(null);
      await expect(service.resetPassword('tok', 'new')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reset password and invalidate refresh tokens', async () => {
      const user = {
        id: '1',
        resetPasswordExpires: new Date(Date.now() + 10000),
      };
      jest
        .spyOn(usersService, 'findByResetToken')
        .mockResolvedValue(user as any);
      await service.resetPassword('tok', 'new');
      expect(usersService.update).toHaveBeenCalled();
      expect(refreshTokenRepo.update).toHaveBeenCalled();
    });
  });
});
