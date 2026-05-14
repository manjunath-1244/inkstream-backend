import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { OwnershipGuard } from './ownership.guard';
import { Role } from '../../modules/users/entities/user.entity';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnershipGuard,
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<OwnershipGuard>(OwnershipGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for admin', async () => {
    const context = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({ user: { role: Role.ADMIN } }),
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should return true currently (placeholder logic)', async () => {
    const context = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({ user: { role: Role.USER } }),
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
  });
});
