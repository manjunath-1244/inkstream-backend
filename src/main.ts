import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';
import { TrimStringsPipe } from './common/pipes/trim-strings.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ensure JSON body parsing is enabled
  const express = require('express');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security features
  app.enableCors();
  app.use(helmet());

  // Swagger Configuration
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true') {
    const config = new DocumentBuilder()
      .setTitle('InkStream API')
      .setDescription('The InkStream Creator Platform API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Enable global validation pipe and custom trim pipe
  app.useGlobalPipes(
    new TrimStringsPipe(),
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
