import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserType } from './dto/user.type';
import { NotFoundException } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserType, { name: 'user', description: 'Get a user by ID' })
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<UserType> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
