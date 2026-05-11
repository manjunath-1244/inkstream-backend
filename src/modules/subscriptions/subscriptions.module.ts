import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController, WebhooksController } from './subscriptions.controller';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Plan, Subscription])],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController, WebhooksController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
