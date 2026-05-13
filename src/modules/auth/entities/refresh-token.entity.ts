import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('refresh_tokens')
export class RefreshToken {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Hashed version of the refresh token' })
  @Column()
  tokenHash!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
