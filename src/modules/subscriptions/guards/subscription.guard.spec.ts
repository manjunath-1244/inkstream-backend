import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionsService } from '../subscriptions.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PlanCode } from '../entities/plan.entity';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;
  let service: SubscriptionsService;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        {
          provide: SubscriptionsService,
          useValue: { findActiveSubscription: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<SubscriptionGuard>(SubscriptionGuard);
    service = module.get<SubscriptionsService>(SubscriptionsService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no plan required', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(null);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({ user: { id: '1' } }),
    } as any;

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has no subscription', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(PlanCode.PREMIUM);
    (service.findActiveSubscription as jest.Mock).mockResolvedValue(null);
    
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({ user: { id: '1' } }),
    } as any;

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
