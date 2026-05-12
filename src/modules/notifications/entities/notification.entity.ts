import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  NEW_COMMENT_ON_YOUR_POST = 'NEW_COMMENT_ON_YOUR_POST',
  NEW_REPLY_TO_YOUR_COMMENT = 'NEW_REPLY_TO_YOUR_COMMENT',
  NEW_LIKE_ON_YOUR_POST = 'NEW_LIKE_ON_YOUR_POST',
  NEW_POST_FROM_FOLLOWED_CREATOR = 'NEW_POST_FROM_FOLLOWED_CREATOR',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  recipientId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient!: User;

  @Column('uuid')
  actorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actorId' })
  actor!: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  // Optional target entity (e.g. Post ID or Comment ID)
  @Column({ type: 'uuid', nullable: true })
  targetId!: string | null;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
