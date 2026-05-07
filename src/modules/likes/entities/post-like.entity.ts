import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('post_likes')
@Unique(['userId', 'postId'])
export class PostLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  user!: User;

  @Column()
  postId!: string;

  @ManyToOne(() => Post)
  post!: Post;

  @CreateDateColumn()
  createdAt!: Date;
}
