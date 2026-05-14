// users/entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export enum Role {
  USER = 'USER',
  CREATOR = 'CREATOR',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

@Entity('users')
export class User {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true })
  email!: string;

  @ApiProperty({ example: 'johndoe', required: false })
  @Column({ unique: true, nullable: true })
  username?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @Column({ nullable: true })
  displayName?: string;

  @ApiHideProperty()
  @Column()
  passwordHash!: string;

  @ApiProperty({ enum: Role, default: Role.USER })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @ApiProperty({ enum: UserStatus, default: UserStatus.ACTIVE })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  suspendedUntil?: Date;

  @ApiProperty({ example: 'I am a creator on InkStream', required: false })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @Column({ nullable: true })
  avatarUrl?: string;

  @ApiProperty({ example: 'https://johndoe.com', required: false })
  @Column({ nullable: true })
  website?: string;

  @ApiHideProperty()
  @Column({ nullable: true })
  resetPasswordToken?: string;

  @ApiHideProperty()
  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @ManyToMany(() => User, (user) => user.following)
  @JoinTable({
    name: 'user_followers',
    joinColumn: { name: 'following_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'follower_id', referencedColumnName: 'id' },
  })
  followers!: User[];

  @ManyToMany(() => User, (user) => user.followers)
  following!: User[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_blocks',
    joinColumn: { name: 'blocker_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'blocked_id', referencedColumnName: 'id' },
  })
  blockedUsers!: User[];
}
