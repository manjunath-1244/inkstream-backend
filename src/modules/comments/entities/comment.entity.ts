import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column()
  authorId!: string;

  @ManyToOne(() => User)
  author!: User;

  @Column()
  postId!: string;

  @ManyToOne(() => Post)
  post!: Post;

  @Column({ nullable: true })
  parentCommentId?: string;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parentCommentId' })
  parent?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies!: Comment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: 0 })
  likeCount!: number;

  @DeleteDateColumn()
  deletedAt?: Date;
}
