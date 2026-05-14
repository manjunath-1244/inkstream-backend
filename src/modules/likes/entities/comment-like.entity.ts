import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('comment_likes')
@Unique(['userId', 'commentId'])
export class CommentLike {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column()
  userId!: string;

  @ManyToOne(() => User)
  user!: User;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @Column()
  commentId!: string;

  @ManyToOne(() => Comment)
  comment!: Comment;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
