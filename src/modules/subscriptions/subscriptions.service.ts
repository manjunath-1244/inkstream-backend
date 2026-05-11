import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Plan, PlanCode } from './entities/plan.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async onModuleInit() {
    const count = await this.planRepository.count();
    if (count === 0) {
      console.log('Seeding subscription plans...');
      const plans = [
        { code: PlanCode.FREE, name: 'Free', price: 0, durationDays: 3650 }, // 10 years for free
        { code: PlanCode.BASIC, name: 'Basic', price: 5, durationDays: 30 },
        { code: PlanCode.PREMIUM, name: 'Premium', price: 15, durationDays: 30 },
      ];
      await this.planRepository.save(plans);
      console.log('Plans seeded successfully!');
    }
  }

  async getPlans() {
    return this.planRepository.find();
  }

  async findActiveSubscription(userId: string) {
    const sub = await this.subscriptionRepository.findOne({
      where: [
        {
          userId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: MoreThan(new Date()),
        },
        {
          userId,
          status: SubscriptionStatus.CANCELED,
          currentPeriodEnd: MoreThan(new Date()),
        },
        {
          userId,
          status: SubscriptionStatus.PAST_DUE,
        },
      ],
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (sub && sub.status === SubscriptionStatus.PAST_DUE) {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      if (sub.updatedAt < threeDaysAgo) {
        // Downgrade to FREE
        return this.checkout(userId, PlanCode.FREE);
      }
      // Within grace period, treat as active for the guard
    }

    return sub;
  }

  async checkout(userId: string, planCode: PlanCode) {
    const plan = await this.planRepository.findOne({ where: { code: planCode } });
    if (!plan) throw new NotFoundException('Plan not found');

    // Cancel existing active or past_due subscriptions
    await this.subscriptionRepository.update(
      { userId, status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]) },
      { status: SubscriptionStatus.EXPIRED },
    );

    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + plan.durationDays);

    const subscription = this.subscriptionRepository.create({
      userId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: expiry,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async cancel(userId: string) {
    const sub = await this.findActiveSubscription(userId);
    if (!sub) throw new NotFoundException('No active subscription found');

    sub.status = SubscriptionStatus.CANCELED;
    return this.subscriptionRepository.save(sub);
  }

  async handleWebhook(userId: string, status: 'succeeded' | 'failed') {
    const sub = await this.subscriptionRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['plan'],
    });

    if (!sub) throw new NotFoundException('Subscription not found');

    if (status === 'succeeded') {
      // Extend by 30 days from current end or now, whichever is later
      const now = new Date();
      const baseDate = sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + 30);
      sub.currentPeriodEnd = newExpiry;
      sub.status = SubscriptionStatus.ACTIVE;
    } else {
      sub.status = SubscriptionStatus.PAST_DUE;
    }

    return this.subscriptionRepository.save(sub);
  }
}
