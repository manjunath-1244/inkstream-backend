import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PostsService } from '../posts/posts.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let postsService: PostsService;

  const mockUsersService = () => ({
    getProfile: jest.fn(),
    update: jest.fn(),
    updateRole: jest.fn(),
    follow: jest.fn(),
    unfollow: jest.fn(),
    isFollowing: jest.fn(),
    block: jest.fn(),
    unblock: jest.fn(),
    findByUsername: jest.fn(),
  });

  const mockPostsService = () => ({
    findByUser: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useFactory: mockUsersService },
        { provide: PostsService, useFactory: mockPostsService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    postsService = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should call service.getProfile', async () => {
      usersService.getProfile.mockResolvedValue({ id: '1', username: 'test' });
      const result = await controller.getProfile('test');
      expect(usersService.getProfile).toHaveBeenCalledWith('test');
      expect(result.username).toBe('test');
    });
  });
});
