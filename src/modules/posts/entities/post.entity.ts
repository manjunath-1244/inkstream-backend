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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'text' })
  contentMarkdown!: string;

  @Column({ nullable: true })
  excerpt?: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status!: PostStatus;

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility!: PostVisibility;

  @Column({ default: 0 })
  readingTimeMinutes!: number;

  @Column({ default: 0 })
  viewCount!: number;

  @Column({ default: 0 })
  likeCount!: number;

  @Column({ default: 0 })
  commentCount!: number;

  @Column({ default: 0 })
  shareCount!: number;

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Column()
  authorId!: string;

  @ManyToOne(() => User, (user) => user.posts)
  author!: User;

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (category) => category.id, { nullable: true })
  category?: Category;

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'post_tags' })
  tags!: Tag[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
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
