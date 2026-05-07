// users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true, nullable: true })
  username?: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column()
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  // Profile fields
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  website?: string;

  // Password Reset fields
  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  @CreateDateColumn()
  createdAt!: Date;

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