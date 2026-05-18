import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.logger.log(`Connecting to Redis at ${host}:${port}...`);

    this.redisClient = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: 3,
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Successfully connected to Redis');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Redis...');
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (err) {
      this.logger.error(`Error getting key "${key}" from Redis:`, err);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL in seconds
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (err) {
      this.logger.error(`Error setting key "${key}" in Redis:`, err);
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (err) {
      this.logger.error(`Error deleting key "${key}" from Redis:`, err);
    }
  }

  /**
   * Invalidate all keys matching a pattern in a non-blocking way using SCAN
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const stream = this.redisClient.scanStream({
        match: pattern,
        count: 100,
      });

      for await (const keys of stream) {
        if (keys && keys.length > 0) {
          await this.redisClient.del(...keys);
          this.logger.log(`Invalidated keys: ${keys.join(', ')}`);
        }
      }
    } catch (err) {
      this.logger.error(
        `Error invalidating pattern "${pattern}" in Redis:`,
        err,
      );
    }
  }
}
