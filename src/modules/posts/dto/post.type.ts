import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { PostStatus, PostVisibility } from '../entities/post.entity';
import { UserType } from '../../users/dto/user.type';
import { CategoryType } from '../../categories/dto/category.type';
import { TagType } from '../../tags/dto/tag.type';

registerEnumType(PostStatus, {
  name: 'PostStatus',
  description: 'The status of the post (DRAFT or PUBLISHED)',
});

registerEnumType(PostVisibility, {
  name: 'PostVisibility',
  description: 'The visibility of the post (PUBLIC or PREMIUM)',
});

@ObjectType('Post')
export class PostType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  slug!: string;

  @Field()
  contentMarkdown!: string;

  @Field({ nullable: true })
  excerpt?: string;

  @Field(() => PostStatus)
  status!: PostStatus;

  @Field(() => PostVisibility)
  visibility!: PostVisibility;

  @Field()
  isHidden!: boolean;

  @Field(() => Int)
  readingTimeMinutes!: number;

  @Field(() => Int)
  viewCount!: number;

  @Field(() => Int)
  likeCount!: number;

  @Field(() => Int)
  commentCount!: number;

  @Field(() => Int)
  shareCount!: number;

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field()
  authorId!: string;

  @Field(() => UserType)
  author!: UserType;

  @Field(() => CategoryType, { nullable: true })
  category?: CategoryType;

  @Field(() => [TagType])
  tags!: TagType[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
