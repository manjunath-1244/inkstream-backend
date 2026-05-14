import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('post_likes')
@Unique(['userId', 'postId'])
export class PostLike {
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
  postId!: string;

  @ManyToOne(() => Post)
  post!: Post;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
