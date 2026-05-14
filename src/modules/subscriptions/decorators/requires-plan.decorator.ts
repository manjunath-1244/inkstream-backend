import { SetMetadata } from '@nestjs/common';
import { PlanCode } from '../entities/plan.entity';

export const REQUIRES_PLAN_KEY = 'requires_plan';
export const RequiresPlan = (...plans: PlanCode[]) =>
  SetMetadata(REQUIRES_PLAN_KEY, plans);
