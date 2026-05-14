import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('audit_logs')
export class AuditLog {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column()
  actorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actorId' })
  actor!: User;

  @ApiProperty({ example: 'USER_LOGIN', description: 'Action performed' })
  @Column()
  action!: string;

  @ApiProperty({
    example: 'USER',
    description: 'Type of entity the action was performed on',
  })
  @Column()
  targetType!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @Column({ nullable: true })
  targetId?: string;

  @ApiProperty({ example: { ip: '127.0.0.1' }, required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt!: Date;
}
