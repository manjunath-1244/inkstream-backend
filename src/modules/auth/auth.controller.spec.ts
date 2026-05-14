import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = () => ({
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useFactory: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call service.register', async () => {
      const dto = {
        email: 't@t.com',
        password: 'p',
        displayName: 'd',
        username: 'u',
      };
      await controller.register(dto);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call service.login with user from request', async () => {
      const req = { user: { id: '1' } };
      const dto = { email: 't@t.com', password: 'p' };
      await controller.login(req, dto);
      expect(service.login).toHaveBeenCalledWith(req.user);
    });
  });
});
