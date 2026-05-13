import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ReportTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  USER = 'USER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

@Entity('reports')
export class Report {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column()
  reporterId!: string;

  @ManyToOne(() => User)
  reporter!: User;

  @ApiProperty({ enum: ReportTargetType, example: ReportTargetType.POST })
  @Column({
    type: 'enum',
    enum: ReportTargetType,
  })
  targetType!: ReportTargetType;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002', description: 'ID of the post, comment, or user being reported' })
  @Column()
  targetId!: string;

  @ApiProperty({ example: 'Spam or misleading content' })
  @Column({ type: 'text' })
  reason!: string;

  @ApiProperty({ enum: ReportStatus, default: ReportStatus.PENDING })
  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status!: ReportStatus;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt!: Date;
}
