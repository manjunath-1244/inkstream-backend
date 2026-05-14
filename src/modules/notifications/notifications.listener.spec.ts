import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsListener } from './notifications.listener';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';

describe('NotificationsListener', () => {
  let listener: NotificationsListener;
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsListener,
        {
          provide: NotificationsService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    listener = module.get<NotificationsListener>(NotificationsListener);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  it('handleUserFollowed should call service.create', async () => {
    const payload = { followerId: 'u1', followingId: 'u2' };
    await listener.handleUserFollowed(payload);
    expect(service.create).toHaveBeenCalledWith({
      recipientId: 'u2',
      actorId: 'u1',
      type: NotificationType.NEW_FOLLOWER,
    });
  });

  it('handlePostLiked should call service.create', async () => {
    const payload = { likerId: 'u1', authorId: 'u2', postId: 'p1' };
    await listener.handlePostLiked(payload);
    expect(service.create).toHaveBeenCalledWith({
      recipientId: 'u2',
      actorId: 'u1',
      type: NotificationType.NEW_LIKE_ON_YOUR_POST,
      targetId: 'p1',
    });
  });

  it('handleCommentCreated should call service.create', async () => {
    const payload = {
      commenterId: 'u1',
      postAuthorId: 'u2',
      postId: 'p1',
      commentId: 'c1',
    };
    await listener.handleCommentCreated(payload);
    expect(service.create).toHaveBeenCalled();
  });

  it('handlePostPublished should call service.create for each follower', async () => {
    const payload = { authorId: 'u1', postId: 'p1', followerIds: ['f1', 'f2'] };
    await listener.handlePostPublished(payload);
    expect(service.create).toHaveBeenCalledTimes(2);
  });
});
