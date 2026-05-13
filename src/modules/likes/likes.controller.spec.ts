import { Test, TestingModule } from '@nestjs/testing';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

describe('LikesController', () => {
  let controller: LikesController;
  let service: LikesService;

  const mockLikesService = () => ({
    togglePostLike: jest.fn(),
    toggleCommentLike: jest.fn(),
    getPostLikes: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikesController],
      providers: [
        { provide: LikesService, useFactory: mockLikesService },
      ],
    }).compile();

    controller = module.get<LikesController>(LikesController);
    service = module.get<LikesService>(LikesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('togglePostLike', () => {
    it('should call service.togglePostLike', async () => {
      const user = { id: 'u1' };
      await controller.togglePostLike('p1', user);
      expect(service.togglePostLike).toHaveBeenCalledWith('u1', 'p1');
    });
  });
});
