import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: SubscriptionsService;

  const mockSubscriptionsService = () => ({
    getPlans: jest.fn(),
    findActiveSubscription: jest.fn(),
    checkout: jest.fn(),
    cancel: jest.fn(),
    handleWebhook: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        { provide: SubscriptionsService, useFactory: mockSubscriptionsService },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMySubscription', () => {
    it('should call service.findActiveSubscription', async () => {
      const user = { id: 'u1' };
      await controller.getMySubscription(user);
      expect(service.findActiveSubscription).toHaveBeenCalledWith('u1');
    });
  });
});
