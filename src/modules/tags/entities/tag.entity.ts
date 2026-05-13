import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tags')
export class Tag {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'Technology' })
  @Column({ unique: true })
  name!: string;

  @ApiProperty({ example: 'technology' })
  @Column({ unique: true })
  slug!: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts!: Post[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
