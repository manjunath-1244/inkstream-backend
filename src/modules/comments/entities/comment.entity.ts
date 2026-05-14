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
import { ApiProperty } from '@nestjs/swagger';

@Entity('comments')
export class Comment {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'This is a great post!' })
  @Column({ type: 'text' })
  body!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column()
  authorId!: string;

  @ManyToOne(() => User)
  author!: User;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @Column()
  postId!: string;

  @ManyToOne(() => Post)
  post!: Post;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  @Column({ nullable: true })
  parentCommentId?: string;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parentCommentId' })
  parent?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies!: Comment[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt!: Date;

  @ApiProperty({ example: 5 })
  @Column({ default: 0 })
  likeCount!: number;

  @ApiProperty({ required: false })
  @DeleteDateColumn()
  deletedAt?: Date;
}
