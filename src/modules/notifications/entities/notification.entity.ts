import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  NEW_COMMENT_ON_YOUR_POST = 'NEW_COMMENT_ON_YOUR_POST',
  NEW_REPLY_TO_YOUR_COMMENT = 'NEW_REPLY_TO_YOUR_COMMENT',
  NEW_LIKE_ON_YOUR_POST = 'NEW_LIKE_ON_YOUR_POST',
  NEW_POST_FROM_FOLLOWED_CREATOR = 'NEW_POST_FROM_FOLLOWED_CREATOR',
}

@Entity('notifications')
export class Notification {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column('uuid')
  recipientId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient!: User;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @Column('uuid')
  actorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actorId' })
  actor!: User;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.NEW_LIKE_ON_YOUR_POST,
  })
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  targetId!: string | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isRead!: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
