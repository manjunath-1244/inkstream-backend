import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_PLAN_KEY } from '../decorators/requires-plan.decorator';
import { SubscriptionsService } from '../subscriptions.service';
import { PlanCode } from '../entities/plan.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<PlanCode[]>(
      REQUIRES_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    const subscription = await this.subscriptionsService.findActiveSubscription(user.id);

    if (!subscription) {
      // If FREE is allowed, we might want to check that.
      // But usually, if a guard is present, it means at least BASIC or PREMIUM is needed.
      if (requiredPlans.includes(PlanCode.FREE)) return true;
      throw new ForbiddenException('This content requires a subscription plan');
    }

    const userPlan = subscription.plan.code;

    // Plan hierarchy: PREMIUM > BASIC > FREE
    const planWeight = {
      [PlanCode.FREE]: 0,
      [PlanCode.BASIC]: 1,
      [PlanCode.PREMIUM]: 2,
    };

    const minRequiredWeight = Math.min(...requiredPlans.map((p) => planWeight[p]));

    if (planWeight[userPlan] >= minRequiredWeight) {
      return true;
    }

    throw new ForbiddenException(
      `This content requires at least a ${requiredPlans.join(' or ')} plan`,
    );
  }
}
