import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly auditService: AuditService,
  ) {}

  async getStats() {
    const [userCount, postCount, commentCount] = await Promise.all([
      this.userRepo.count(),
      this.postRepo.count(),
      this.commentRepo.count(),
    ]);

    // MRR placeholder for now until subscriptions are implemented
    const activeSubscriptions = 0;
    const mrr = 0;

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
}
