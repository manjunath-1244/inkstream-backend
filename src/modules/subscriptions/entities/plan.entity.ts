import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanCode {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
}

@Entity('plans')
export class Plan {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ enum: PlanCode, example: PlanCode.PREMIUM })
  @Column({
    type: 'enum',
    enum: PlanCode,
    unique: true,
  })
  code!: PlanCode;

  @ApiProperty({ example: 'Premium Plan' })
  @Column()
  name!: string;

  @ApiProperty({ example: 19.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @ApiProperty({ example: 30 })
  @Column({ default: 30 })
  durationDays!: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
