import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { AuditService } from '../audit/audit.service';

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: any;
  let postRepo: any;
  let commentRepo: any;
  let subscriptionRepo: any;
  let auditService: AuditService;

  const mockRepo = () => ({
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  });

  const mockAuditService = () => ({
    record: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(Post), useFactory: mockRepo },
        { provide: getRepositoryToken(Comment), useFactory: mockRepo },
        { provide: getRepositoryToken(Subscription), useFactory: mockRepo },
        { provide: AuditService, useFactory: mockAuditService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = module.get(getRepositoryToken(User));
    postRepo = module.get(getRepositoryToken(Post));
    commentRepo = module.get(getRepositoryToken(Comment));
    subscriptionRepo = module.get(getRepositoryToken(Subscription));
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return counts and MRR', async () => {
      userRepo.count.mockResolvedValue(10);
      postRepo.count.mockResolvedValue(20);
      commentRepo.count.mockResolvedValue(30);
      subscriptionRepo.find.mockResolvedValue([
        { plan: { price: 10 } },
        { plan: { price: 20 } },
      ]);

      const result = await service.getStats();
      expect(result.totals.users).toBe(10);
      expect(result.totals.mrr).toBe(30);
    });
  });

  describe('banUser', () => {
    it('should throw NotFoundException if user missing', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.banUser('u1', 'a1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update user status to BANNED', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', email: 't@t.com' });
      await service.banUser('u1', 'admin-1');
      expect(userRepo.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe('suspendUser', () => {
    it('should update user status to SUSPENDED', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', email: 't@t.com' });
      await service.suspendUser('u1', 'admin-1', 24);
      expect(userRepo.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe('hidePost', () => {
    it('should toggle isHidden and record audit', async () => {
      const post = { id: 'p1', isHidden: false };
      postRepo.findOne.mockResolvedValue(post);
      const result = await service.hidePost('p1', 'admin-1');
      expect(result.isHidden).toBe(true);
      expect(postRepo.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });
  });
});
