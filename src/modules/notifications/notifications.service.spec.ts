import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';

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
        {
          provide: getRepositoryToken(Notification),
          useFactory: mockNotificationRepo,
        },
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

  describe('create', () => {
    it('should not create notification for self', async () => {
      const result = await service.create({
        recipientId: 'u1',
        actorId: 'u1',
        type: NotificationType.NEW_LIKE_ON_YOUR_POST,
      });
      expect(result).toBeNull();
    });

    it('should create notification for others', async () => {
      repo.create.mockReturnValue({ recipientId: 'u2' });
      repo.save.mockResolvedValue({ id: 'n1' });
      const result = await service.create({
        recipientId: 'u2',
        actorId: 'u1',
        type: NotificationType.NEW_LIKE_ON_YOUR_POST,
      });
      expect(result.id).toBe('n1');
    });
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

  describe('markAsRead', () => {
    it('should throw NotFoundException if notification missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.markAsRead('n1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should mark as read if found', async () => {
      const notification = { id: 'n1', isRead: false };
      repo.findOne.mockResolvedValue(notification);
      repo.save.mockResolvedValue({ ...notification, isRead: true });
      const result = await service.markAsRead('n1', 'u1');
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should call update', async () => {
      await service.markAllAsRead('u1');
      expect(repo.update).toHaveBeenCalledWith(
        { recipientId: 'u1', isRead: false },
        { isRead: true },
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count', async () => {
      repo.count.mockResolvedValue(5);
      const result = await service.getUnreadCount('u1');
      expect(result.count).toBe(5);
    });
  });
});
