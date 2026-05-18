import { Resolver, Query } from '@nestjs/graphql';
import { TagsService } from './tags.service';
import { TagType } from './dto/tag.type';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Resolver(() => TagType)
export class TagsResolver {
  constructor(private readonly tagsService: TagsService) {}

  @Query(() => [TagType], { name: 'tags', description: 'Get all tags' })
  async getTags(): Promise<TagType[]> {
    return this.tagsService.findAll();
  }
}
