import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('Category')
export class CategoryType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdAt!: Date;
}
