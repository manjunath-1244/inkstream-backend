import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersResolver } from './users.resolver';

import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PostsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersResolver],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
