import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Role } from '../entities/user.entity';

registerEnumType(Role, {
  name: 'Role',
  description: 'The role of the user within the platform',
});

@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field(() => Role)
  role!: Role;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  website?: string;

  @Field()
  createdAt!: Date;
}
