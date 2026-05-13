import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repo: any;

  const mockAuditRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useFactory: mockAuditRepo },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repo = module.get(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('record', () => {
    it('should create and save an audit log', async () => {
      const data = { actorId: 'u1', action: 'TEST', targetType: 'POST', targetId: 'p1' };
      repo.create.mockReturnValue(data);
      repo.save.mockResolvedValue({ id: 'a1', ...data });

      await service.record(data.actorId, data.action, data.targetType, data.targetId);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });
  });
});
