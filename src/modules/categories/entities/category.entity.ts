import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('categories')
export class Category {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'Lifestyle' })
  @Column({ unique: true })
  name!: string;

  @ApiProperty({ example: 'lifestyle' })
  @Column({ unique: true })
  slug!: string;

  @ApiProperty({
    example: 'Posts about daily life and habits',
    required: false,
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
