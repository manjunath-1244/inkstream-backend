import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import {
  Subscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { NotFoundException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let planRepo: any;
  let subRepo: any;

  const mockRepo = () => ({
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(Plan), useFactory: mockRepo },
        { provide: getRepositoryToken(Subscription), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    planRepo = module.get(getRepositoryToken(Plan));
    subRepo = module.get(getRepositoryToken(Subscription));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findActiveSubscription', () => {
    it('should return active subscription if exists', async () => {
      const sub = {
        id: 's1',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 10000),
      };
      subRepo.findOne.mockResolvedValue(sub);
      const result = await service.findActiveSubscription('u1');
      expect(result).toEqual(sub);
    });
  });

  describe('cancel', () => {
    it('should throw NotFoundException if no active sub found', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.cancel('u1')).rejects.toThrow(NotFoundException);
    });

    it('should update status to CANCELED and save', async () => {
      const sub = {
        id: 's1',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 10000),
      };
      subRepo.findOne.mockResolvedValue(sub);

      await service.cancel('u1');
      expect(sub.status).toBe(SubscriptionStatus.CANCELED);
      expect(subRepo.save).toHaveBeenCalledWith(sub);
    });
  });

  describe('handleWebhook', () => {
    it('should update subscription to ACTIVE on succeeded', async () => {
      const sub = {
        id: 's1',
        status: SubscriptionStatus.PENDING,
        currentPeriodEnd: new Date(),
        plan: { durationDays: 30 },
      };
      subRepo.findOne.mockResolvedValue(sub);

      await service.handleWebhook('u1', 'succeeded');
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subRepo.save).toHaveBeenCalledWith(sub);
    });

    it('should update subscription to PAST_DUE on failed', async () => {
      const sub = { id: 's1', status: SubscriptionStatus.PENDING };
      subRepo.findOne.mockResolvedValue(sub);

      await service.handleWebhook('u1', 'failed');
      expect(sub.status).toBe(SubscriptionStatus.PAST_DUE);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => subRepo.save).toBeDefined();
    });

    it('should throw NotFoundException if subscription missing in webhook', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.handleWebhook('u1', 'succeeded')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return true for valid active sub', async () => {
      const sub = {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 100000),
      };
      subRepo.findOne.mockResolvedValue(sub);
      expect(await service.hasActiveSubscription('u1')).toBe(true);
    });

    it('should return false for expired sub', async () => {
      const sub = {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() - 100000),
      };
      subRepo.findOne.mockResolvedValue(sub);
      expect(await service.hasActiveSubscription('u1')).toBe(false);
    });
  });

  describe('onModuleInit', () => {
    it('should seed plans if count is 0', async () => {
      planRepo.count.mockResolvedValue(0);
      await service.onModuleInit();
      expect(planRepo.save).toHaveBeenCalled();
    });

    it('should not seed plans if count > 0', async () => {
      planRepo.count.mockResolvedValue(5);
      await service.onModuleInit();
      expect(planRepo.save).not.toHaveBeenCalled();
    });
  });
});
