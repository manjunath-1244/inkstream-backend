import { Public, IS_PUBLIC_KEY } from './public.decorator';

describe('PublicDecorator', () => {
  it('should set isPublic metadata to true', () => {
    class TestController {
      @Public()
      test() {}
    }

    const metadata = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      TestController.prototype.test,
    );
    expect(metadata).toBe(true);
  });
});
