import { ObjectType, Field, Int } from '@nestjs/graphql';
import { PostType } from './post.type';

@ObjectType('PaginationMeta')
export class PaginationMetaType {
  @Field(() => Int)
  totalItems!: number;

  @Field(() => Int)
  itemCount!: number;

  @Field(() => Int)
  itemsPerPage!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field(() => Int)
  currentPage!: number;
}

@ObjectType('PaginatedPosts')
export class PaginatedPostsType {
  @Field(() => [PostType])
  items!: PostType[];

  @Field(() => PaginationMetaType)
  meta!: PaginationMetaType;
}
