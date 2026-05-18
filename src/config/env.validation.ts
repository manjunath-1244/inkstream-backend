import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Security
  BCRYPT_ROUNDS: Joi.number().integer().min(1).max(20).default(10),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_TTL: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_TTL: Joi.string().required(),

  // Throttler
  THROTTLE_TTL: Joi.number().required(),
  THROTTLE_LIMIT: Joi.number().required(),

  // S3 / MinIO
  S3_ENDPOINT: Joi.string().required(),
  S3_REGION: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_PUBLIC_URL: Joi.string().required(),

  // Mail
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().port().default(1025),
  MAIL_USER: Joi.string().allow('').optional(),
  MAIL_PASS: Joi.string().allow('').optional(),
  MAIL_FROM: Joi.string().email().required(),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
});
