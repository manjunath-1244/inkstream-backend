import { Roles, ROLES_KEY } from './roles.decorator';
import { Role } from '../../users/entities/user.entity';

describe('RolesDecorator', () => {
  it('should set roles metadata', () => {
    class TestController {
      @Roles(Role.ADMIN)
      test() {}
    }

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype.test,
    );
    expect(metadata).toEqual([Role.ADMIN]);
  });
});
