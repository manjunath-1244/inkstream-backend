import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { PostsService } from '../posts/posts.service';

describe('SearchController', () => {
  let controller: SearchController;
  let postsService: PostsService;

  const mockPostsService = () => ({
    searchPosts: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: PostsService, useFactory: mockPostsService },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    postsService = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchPosts', () => {
    it('should call postsService.searchPosts', async () => {
      const user = { id: 'u1' };
      const dto = { q: 'test' };
      await controller.searchPosts(dto as any, user);
      expect(postsService.searchPosts).toHaveBeenCalledWith('test', {}, 'u1');
    });
  });
});
