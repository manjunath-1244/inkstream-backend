import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { PostsService } from '../posts/posts.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @Inject(forwardRef(() => PostsService))
    private readonly postsService: PostsService,
  ) {}

  async findAll() {
    return this.tagRepository.createQueryBuilder('tag')
      .loadRelationCountAndMap('tag.postCount', 'tag.posts')
      .orderBy('tag.name', 'ASC')
      .getMany();
  }

  async findPostsByTag(slug: string, paginationDto: PaginationDto) {
    const tag = await this.findBySlug(slug);
    return this.postsService.findByTag(tag.id, paginationDto);
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { slug } });
    if (!tag) {
      throw new NotFoundException(`Tag with slug ${slug} not found`);
    }
    return tag;
  }

  async create(data: Partial<Tag>): Promise<Tag> {
    const existing = await this.tagRepository.findOne({
      where: [{ name: data.name }, { slug: data.slug }],
    });
    if (existing) {
      throw new ConflictException('Tag with this name or slug already exists');
    }
    const tag = this.tagRepository.create(data);
    return this.tagRepository.save(tag);
  }

  async findOrCreate(name: string): Promise<Tag> {
    const slug = name.toLowerCase().replace(/ /g, '-');
    let tag = await this.tagRepository.findOne({ where: { slug } });
    if (!tag) {
      tag = this.tagRepository.create({ name, slug });
      tag = await this.tagRepository.save(tag);
    }
    return tag;
  }

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagRepository.remove(tag);
  }
}
