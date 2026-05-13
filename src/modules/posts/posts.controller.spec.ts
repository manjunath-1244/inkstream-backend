import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;
  let subscriptionsService: SubscriptionsService;

  const mockPostsService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getTrending: jest.fn(),
    incrementViewCount: jest.fn(),
  });

  const mockSubscriptionsService = () => ({
    findActiveSubscription: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        { provide: PostsService, useFactory: mockPostsService },
        { provide: SubscriptionsService, useFactory: mockSubscriptionsService },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const user = { id: 'user-1' };
      const dto = { title: 'Test' };
      await controller.create(dto as any, user);
      expect(postsService.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });
});
