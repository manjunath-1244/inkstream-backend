import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('user.followed')
  async handleUserFollowed(payload: { followerId: string; followingId: string }) {
    await this.notificationsService.create({
      recipientId: payload.followingId,
      actorId: payload.followerId,
      type: NotificationType.NEW_FOLLOWER,
    });
  }

  @OnEvent('post.liked')
  async handlePostLiked(payload: { likerId: string; authorId: string; postId: string }) {
    await this.notificationsService.create({
      recipientId: payload.authorId,
      actorId: payload.likerId,
      type: NotificationType.NEW_LIKE_ON_YOUR_POST,
      targetId: payload.postId,
    });
  }

  @OnEvent('comment.created')
  async handleCommentCreated(payload: { commenterId: string; postAuthorId: string; postId: string, commentId: string }) {
    await this.notificationsService.create({
      recipientId: payload.postAuthorId,
      actorId: payload.commenterId,
      type: NotificationType.NEW_COMMENT_ON_YOUR_POST,
      targetId: payload.postId, // Or commentId depending on preference, we use postId here for easy navigation to the post
    });
  }

  @OnEvent('comment.replied')
  async handleCommentReplied(payload: { replierId: string; parentCommentAuthorId: string; postId: string, commentId: string }) {
    await this.notificationsService.create({
      recipientId: payload.parentCommentAuthorId,
      actorId: payload.replierId,
      type: NotificationType.NEW_REPLY_TO_YOUR_COMMENT,
      targetId: payload.postId,
    });
  }

  @OnEvent('post.published')
  async handlePostPublished(payload: { authorId: string; postId: string; followerIds: string[] }) {
    // Create notifications for all followers
    // In a real system, you might want to bulk insert this
    for (const followerId of payload.followerIds) {
      await this.notificationsService.create({
        recipientId: followerId,
        actorId: payload.authorId,
        type: NotificationType.NEW_POST_FROM_FOLLOWED_CREATOR,
        targetId: payload.postId,
      });
    }
  }
}
