import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  PREMIUM = 'PREMIUM',
}

@Entity('posts')
export class Post {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'My First Post' })
  @Column()
  title!: string;

  @ApiProperty({ example: 'my-first-post' })
  @Column({ unique: true })
  slug!: string;

  @ApiProperty({ example: '# Hello World\nThis is my post content.' })
  @Column({ type: 'text' })
  contentMarkdown!: string;

  @ApiProperty({ example: 'A brief summary of the post', required: false })
  @Column({ nullable: true })
  excerpt?: string;

  @ApiProperty({ enum: PostStatus, default: PostStatus.DRAFT })
  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status!: PostStatus;

  @ApiProperty({ enum: PostVisibility, default: PostVisibility.PUBLIC })
  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility!: PostVisibility;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isHidden!: boolean;

  @ApiProperty({ example: 5 })
  @Column({ default: 0 })
  readingTimeMinutes!: number;

  @ApiProperty({ example: 100 })
  @Column({ default: 0 })
  viewCount!: number;

  @ApiProperty({ example: 10 })
  @Column({ default: 0 })
  likeCount!: number;

  @ApiProperty({ example: 3 })
  @Column({ default: 0 })
  commentCount!: number;

  @ApiProperty({ example: 2 })
  @Column({ default: 0 })
  shareCount!: number;

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @Column({ nullable: true })
  coverImageUrl?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column()
  authorId!: string;

  @ManyToOne(() => User, (user) => user.posts)
  author!: User;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (category) => category.id, { nullable: true })
  category?: Category;

  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable({ name: 'post_tags' })
  tags!: Tag[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt!: Date;

  @ApiProperty({ required: false })
  @DeleteDateColumn()
  deletedAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.title) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  calculateReadingTime() {
    if (this.contentMarkdown) {
      const words = this.contentMarkdown.split(/\s+/).length;
      this.readingTimeMinutes = Math.ceil(words / 200);
    }
  }
}
