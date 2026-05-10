import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule],
  controllers: [SearchController],
})
export class SearchModule {}
