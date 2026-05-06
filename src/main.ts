import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ensure JSON body parsing is enabled
  const express = require('express');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,   // Strip unknown properties
      forbidNonWhitelisted: true, // Reject requests with unknown properties
      transform: true,   // Transform incoming data to match DTO types
    }),
  );
  // Apply global HTTP exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  // Apply global TypeORM exception filter
  app.useGlobalFilters(new TypeOrmExceptionFilter());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
