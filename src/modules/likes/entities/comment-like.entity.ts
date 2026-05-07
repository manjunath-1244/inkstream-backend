import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('comment_likes')
@Unique(['userId', 'commentId'])
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  user!: User;

  @Column()
  commentId!: string;

  @ManyToOne(() => Comment)
  comment!: Comment;

  @CreateDateColumn()
  createdAt!: Date;
}
