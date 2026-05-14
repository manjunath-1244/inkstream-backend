import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategoriesService } from '../modules/categories/categories.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const categoriesService = app.get(CategoriesService);

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
    { name: 'Business', slug: 'business', description: 'Finance and economy' },
    {
      name: 'Lifestyle',
      slug: 'lifestyle',
      description: 'Fashion, travel, and health',
    },
  ];

  console.log('Seeding categories...');

  for (const cat of initialCategories) {
    try {
      await categoriesService.create(cat);
      console.log(`Created category: ${cat.name}`);
    } catch {
      console.log(`Category ${cat.name} already exists, skipping.`);
    }
  }

  console.log('Seeding complete!');
  await app.close();
}

void bootstrap();
