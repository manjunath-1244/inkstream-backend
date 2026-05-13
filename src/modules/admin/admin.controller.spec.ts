import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;
  let auditService: AuditService;

  const mockAdminService = () => ({
    updateUserRole: jest.fn(),
    banUser: jest.fn(),
    getStats: jest.fn(),
    getAuditLogs: jest.fn(),
  });

  const mockAuditService = () => ({
    findAll: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useFactory: mockAdminService },
        { provide: AuditService, useFactory: mockAuditService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should call adminService.getStats', async () => {
      await controller.getStats();
      expect(adminService.getStats).toHaveBeenCalled();
    });
  });

  describe('getAuditLog', () => {
    it('should call auditService.findAll', async () => {
      await controller.getAuditLog(1, 20);
      expect(auditService.findAll).toHaveBeenCalledWith(1, 20);
    });
  });
});
