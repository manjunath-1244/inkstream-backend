import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { NotFoundException } from '@nestjs/common';

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

  describe('findAll', () => {
    it('should return paginated reports', async () => {
      const items = [{ id: 'r1' }];
      repo.findAndCount.mockResolvedValue([items, 1]);
      const result = await service.findAll(1, 10);
      expect(result.items).toEqual(items);
      expect(repo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if report missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.updateStatus('r1', ReportStatus.RESOLVED),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update status and save', async () => {
      const report = { id: 'r1', status: ReportStatus.PENDING };
      repo.findOne.mockResolvedValue(report);
      repo.save.mockResolvedValue({ ...report, status: ReportStatus.RESOLVED });
      const result = await service.updateStatus('r1', ReportStatus.RESOLVED);
      expect(result.status).toBe(ReportStatus.RESOLVED);
    });
  });
});
