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
import { PlanCode, Plan } from './entities/plan.entity';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { Subscription } from './entities/subscription.entity';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

class CheckoutDto {
  @ApiProperty({ enum: PlanCode, example: PlanCode.PREMIUM })
  @IsEnum(PlanCode)
  @IsNotEmpty()
  planCode!: PlanCode;
}

class WebhookDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: ['succeeded', 'failed'], example: 'succeeded' })
  @IsEnum(['succeeded', 'failed'])
  @IsNotEmpty()
  status!: 'succeeded' | 'failed';
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user active subscription' })
  @ApiOkResponse({
    type: Subscription,
    description: 'Returns active subscription or null',
  })
  async getMySubscription(@CurrentUser() user: any) {
    const sub = await this.subscriptionsService.findActiveSubscription(user.id);
    return sub || null;
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate checkout for a plan' })
  @ApiOkResponse({ description: 'Returns checkout session or status' })
  async checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.subscriptionsService.checkout(user.id, dto.planCode);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiOkResponse({ description: 'Subscription canceled successfully' })
  async cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancel(user.id);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @ApiOkResponse({ type: [Plan], description: 'Returns list of plans' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }
}

@ApiTags('Webhooks')
@Controller('webhooks')
@Public()
export class WebhooksController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle payment gateway webhooks' })
  @ApiOkResponse({ description: 'Webhook processed successfully' })
  async handlePaymentWebhook(@Body() dto: WebhookDto) {
    return this.subscriptionsService.handleWebhook(dto.userId, dto.status);
  }
}
