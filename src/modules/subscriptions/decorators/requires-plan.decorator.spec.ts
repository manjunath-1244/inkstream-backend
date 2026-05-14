import { RequiresPlan, REQUIRES_PLAN_KEY } from './requires-plan.decorator';
import { PlanCode } from '../entities/plan.entity';

describe('RequiresPlanDecorator', () => {
  it('should set requires_plan metadata', () => {
    class TestController {
      @RequiresPlan(PlanCode.PREMIUM)
      test() {}
    }

    const metadata = Reflect.getMetadata(
      REQUIRES_PLAN_KEY,
      TestController.prototype.test,
    );
    expect(metadata).toEqual([PlanCode.PREMIUM]);
  });
});
