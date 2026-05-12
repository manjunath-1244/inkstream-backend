import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { AuditService } from '../audit/audit.service';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly auditService: AuditService,
  ) {}

  async getStats() {
    const [userCount, postCount, commentCount] = await Promise.all([
      this.userRepo.count(),
      this.postRepo.count(),
      this.commentRepo.count(),
    ]);

    // MRR Calculation
    const activeSubs = await this.subscriptionRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    const activeSubscriptions = activeSubs.length;
    const mrr = activeSubs.reduce((acc, sub) => acc + sub.plan.price, 0);

    return {
      totals: {
        users: userCount,
        posts: postCount,
        comments: commentCount,
        activeSubscriptions,
        mrr,
      },
    };
  }

  async banUser(id: string, adminId: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.status = UserStatus.BANNED;
    await this.userRepo.save(user);

    await this.auditService.record(
      adminId,
      'BAN_USER',
      'USER',
      id,
      { previousStatus: user.status },
    );

    return { message: `User ${user.email} has been permanently banned` };
  }

  async suspendUser(id: string, adminId: string, durationHours: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const suspendedUntil = new Date();
    suspendedUntil.setHours(suspendedUntil.getHours() + durationHours);

    user.status = UserStatus.SUSPENDED;
    user.suspendedUntil = suspendedUntil;
    await this.userRepo.save(user);

    await this.auditService.record(
      adminId,
      'SUSPEND_USER',
      'USER',
      id,
      { previousStatus: user.status, durationHours, suspendedUntil },
    );

    return { message: `User ${user.email} suspended for ${durationHours} hours` };
  }

  async hidePost(id: string, adminId: string) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    post.isHidden = !post.isHidden;
    await this.postRepo.save(post);

    await this.auditService.record(
      adminId,
      post.isHidden ? 'HIDE_POST' : 'UNHIDE_POST',
      'POST',
      id,
    );

    return { message: `Post ${post.isHidden ? 'hidden' : 'unhidden'} successfully`, isHidden: post.isHidden };
  }
}
