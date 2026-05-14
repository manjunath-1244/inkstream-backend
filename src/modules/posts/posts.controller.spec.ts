import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;
  let _subscriptionsService: SubscriptionsService;

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
    _subscriptionsService =
      module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const pagination = { page: 1, limit: 10 };
      await controller.findAll(pagination, { id: 'u1' });
      expect(postsService.findAll).toHaveBeenCalledWith(pagination, 'u1');
    });
  });

  describe('getTrending', () => {
    it('should call service.getTrending', async () => {
      const pagination = { page: 1, limit: 10 };
      await controller.getTrending(pagination, { id: 'u1' });
      expect(postsService.getTrending).toHaveBeenCalledWith(pagination, 'u1');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and incrementViewCount', async () => {
      const post = { id: 'p1', authorId: 'a1', visibility: 'PUBLIC' };
      (postsService.findOne as jest.Mock).mockResolvedValue(post);

      const result = await controller.findOne('p1', { id: 'u1' });
      expect(postsService.findOne).toHaveBeenCalledWith('p1');
      expect(postsService.incrementViewCount).toHaveBeenCalledWith('p1');
      expect(result).toEqual(post);
    });
  });

  describe('update', () => {
    it('should call service.update with user context', async () => {
      const user = { id: 'u1', role: 'USER' };
      const dto = { title: 'Updated' };
      await controller.update('p1', dto, user);
      expect(postsService.update).toHaveBeenCalledWith('p1', dto, user);
    });
  });

  describe('remove', () => {
    it('should call service.remove with user context', async () => {
      const user = { id: 'u1', role: 'USER' };
      await controller.remove('p1', user);
      expect(postsService.remove).toHaveBeenCalledWith('p1', user);
    });
  });
});
