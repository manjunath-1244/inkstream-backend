import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let repo: any;

  const mockReportRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Report), useFactory: mockReportRepo },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    repo = module.get(getRepositoryToken(Report));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a report', async () => {
      const dto = { targetType: 'POST', targetId: 'p1', reason: 'spam' };
      repo.create.mockReturnValue({ ...dto, reporterId: 'u1' });
      repo.save.mockResolvedValue({ id: 'r1', ...dto, reporterId: 'u1' });

      const result = await service.create('u1', dto as any);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result.id).toBe('r1');
    });
  });
});
