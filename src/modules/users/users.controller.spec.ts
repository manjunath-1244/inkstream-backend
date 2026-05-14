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

  describe('updateProfile', () => {
    it('should call service.update', async () => {
      const user = { id: 'u1' };
      const dto = { displayName: 'New Name' };
      await controller.updateProfile(user, dto);
      expect(usersService.update).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('follow', () => {
    it('should call service.follow', async () => {
      const user = { id: 'u1' };
      await controller.follow('u2', user);
      expect(usersService.follow).toHaveBeenCalledWith('u1', 'u2');
    });
  });

  describe('unfollow', () => {
    it('should call service.unfollow', async () => {
      const user = { id: 'u1' };
      await controller.unfollow('u2', user);
      expect(usersService.unfollow).toHaveBeenCalledWith('u1', 'u2');
    });
  });

  describe('block', () => {
    it('should call service.block', async () => {
      const user = { id: 'u1' };
      await controller.block('u2', user);
      expect(usersService.block).toHaveBeenCalledWith('u1', 'u2');
    });
  });

  describe('getUserPosts', () => {
    it('should call postsService.findByUser', async () => {
      const pagination = { page: 1, limit: 10 };
      usersService.findByUsername.mockResolvedValue({ id: 'u1' });
      await controller.getUserPosts('testuser', pagination);
      expect(postsService.findByUser).toHaveBeenCalledWith('u1', pagination);
    });
  });
});
