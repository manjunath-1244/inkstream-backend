import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

// Helper to extract the factory function from the decorator
function getParamDecoratorFactory(decorator: any) {
  class TestController {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    test(@decorator() user: any) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'test');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return args[Object.keys(args)[0]].factory;
}

describe('CurrentUserDecorator', () => {
  it('should extract user from request', () => {
    const mockUser = { id: '1', email: 'test@test.com' };
    const mockRequest = { user: mockUser };
    const mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue(mockRequest),
    } as unknown as ExecutionContext;

    const factory = getParamDecoratorFactory(CurrentUser);
    const result = factory(null, mockContext);

    expect(result).toBe(mockUser);
  });
});
