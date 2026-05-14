import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { PostsService } from './posts.service';

describe('FeedController', () => {
  let controller: FeedController;
  let service: PostsService;

  const mockPostsService = {
    getFeed: jest.fn().mockResolvedValue({ items: [], meta: {} }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    controller = module.get<FeedController>(FeedController);
    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFeed', () => {
    it('should call postsService.getFeed with user id and pagination', async () => {
      const user = { id: 'user-1' };
      const paginationDto = { page: 1, limit: 10 };

      await controller.getFeed(paginationDto, user);

      expect(service.getFeed).toHaveBeenCalledWith('user-1', paginationDto);
    });
  });
});
