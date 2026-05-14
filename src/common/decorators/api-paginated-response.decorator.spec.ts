import { ApiPaginatedResponse } from './api-paginated-response.decorator';

describe('ApiPaginatedResponseDecorator', () => {
  it('should set swagger metadata', () => {
    class MockModel {}
    class TestController {
      @ApiPaginatedResponse(MockModel)
      test() {}
    }

    const metadata = Reflect.getMetadata(
      'swagger/apiResponse',
      TestController.prototype.test,
    );
    expect(metadata).toBeDefined();
    // NestJS Swagger internal metadata structure is complex, but we can verify it exists
    expect(metadata['200']).toBeDefined();
  });
});
