import { Test, TestingModule } from '@nestjs/testing';
import { ModerationController } from './moderation.controller';
import { AdminService } from '../admin/admin.service';

describe('ModerationController', () => {
  let controller: ModerationController;
  let adminService: AdminService;

  const mockAdminService = () => ({
    suspendUser: jest.fn(),
    hidePost: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModerationController],
      providers: [
        { provide: AdminService, useFactory: mockAdminService },
      ],
    }).compile();

    controller = module.get<ModerationController>(ModerationController);
    adminService = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('suspendUser', () => {
    it('should call adminService.suspendUser', async () => {
      const dto = { durationHours: 24 };
      const admin = { id: 'admin-id' };
      await controller.suspendUser('u1', dto as any, admin);
      expect(adminService.suspendUser).toHaveBeenCalledWith('u1', 'admin-id', 24);
    });
  });
});
