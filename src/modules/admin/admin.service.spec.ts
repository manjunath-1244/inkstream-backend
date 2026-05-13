import { Test, TestingModule } from '@nestjs/testing';
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
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('banUser', () => {
    it('should update user status to BANNED', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', email: 't@t.com' });
      await service.banUser('u1', 'admin-1');
      expect(userRepo.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });
  });
});
