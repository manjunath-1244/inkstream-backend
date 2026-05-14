import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repo: any;

  const mockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repo = module.get(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('record should call create and save', async () => {
    repo.create.mockReturnValue({ action: 'TEST' });
    await service.record('a1', 'TEST', 'USER');
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });

  it('findAll should return paginated logs', async () => {
    const items = [{ id: '1' }];
    repo.findAndCount.mockResolvedValue([items, 1]);
    const result = await service.findAll(1, 10);
    expect(result.items).toEqual(items);
    expect(repo.findAndCount).toHaveBeenCalled();
  });
});
