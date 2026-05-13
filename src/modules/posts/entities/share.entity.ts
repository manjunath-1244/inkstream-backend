import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('shares')
export class Share {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column()
  postId!: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'postId' })
  post!: Post;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002', required: false })
  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ApiProperty({ example: 'twitter', description: 'Platform or channel where the post was shared' })
  @Column()
  channel!: string; // twitter, linkedin, copy_link, email

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
