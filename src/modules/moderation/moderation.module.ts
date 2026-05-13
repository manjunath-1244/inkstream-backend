import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [ModerationController],
})
export class ModerationModule {}
