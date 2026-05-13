import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: any;

  const mockNotificationRepo = () => ({
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useFactory: mockNotificationRepo },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repo = module.get(getRepositoryToken(Notification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const items = [{ id: '1', type: 'TEST' }];
      repo.findAndCount.mockResolvedValue([items, 1]);
      
      const result = await service.findAll('user-1', { page: 1, limit: 10 });
      expect(result.data).toEqual(items);
      expect(repo.findAndCount).toHaveBeenCalled();
    });
  });
});
