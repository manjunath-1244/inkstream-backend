import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    const count = await this.categoryRepository.count();
    if (count === 0) {
      console.log('Seeding initial categories...');
      const initialCategories = [
        {
          name: 'Politics',
          slug: 'politics',
          description: 'News and discussions about politics',
        },
        {
          name: 'Technology',
          slug: 'technology',
          description: 'Latest in tech and gadgets',
        },
        {
          name: 'Entertainment',
          slug: 'entertainment',
          description: 'Movies, music, and celebrity news',
        },
        { name: 'Sports', slug: 'sports', description: 'World sports updates' },
        {
          name: 'Business',
          slug: 'business',
          description: 'Finance and economy',
        },
        {
          name: 'Lifestyle',
          slug: 'lifestyle',
          description: 'Fashion, travel, and health',
        },
      ];

      for (const cat of initialCategories) {
        await this.create(cat).catch(() => {});
      }
      console.log('Seeding complete!');
    }
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { slug } });
    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }
    return category;
  }

  async create(data: Partial<Category>): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: [{ name: data.name }, { slug: data.slug }],
    });
    if (existing) {
      throw new ConflictException(
        'Category with this name or slug already exists',
      );
    }
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
