import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlanCode } from './entities/plan.entity';
import { Public } from '../auth/decorators/public.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  async getMySubscription(@CurrentUser() user: any) {
    const sub = await this.subscriptionsService.findActiveSubscription(user.id);
    return sub || null;
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(
    @CurrentUser() user: any,
    @Body('planCode') planCode: PlanCode,
  ) {
    return this.subscriptionsService.checkout(user.id, planCode);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancel(user.id);
  }

  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }
}

@Controller('webhooks')
@Public()
export class WebhooksController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('payment')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(
    @Body('userId') userId: string,
    @Body('status') status: 'succeeded' | 'failed',
  ) {
    return this.subscriptionsService.handleWebhook(userId, status);
  }
}
