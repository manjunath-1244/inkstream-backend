import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
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
      const sub = { id: 's1', status: SubscriptionStatus.ACTIVE, currentPeriodEnd: new Date(Date.now() + 10000) };
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
      const sub = { id: 's1', status: SubscriptionStatus.ACTIVE, currentPeriodEnd: new Date(Date.now() + 10000) };
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
        plan: { durationDays: 30 } 
      };
      subRepo.findOne.mockResolvedValue(sub);
      
      await service.handleWebhook('u1', 'succeeded');
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subRepo.save).toHaveBeenCalledWith(sub);
    });
  });
});
