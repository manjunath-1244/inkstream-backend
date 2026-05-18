import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('Tag')
export class TagType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field()
  createdAt!: Date;
}
