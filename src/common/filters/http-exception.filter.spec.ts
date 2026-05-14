import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch exception and return formatted response', () => {
    const mockStatus = 404;
    const mockResponse = { message: 'Not Found', error: 'Not Found' };
    const exception = new HttpException(mockResponse, mockStatus);

    const mockJson = jest.fn();
    const mockStatusFn = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatusFn });
    const mockGetRequest = jest.fn().mockReturnValue({
      method: 'GET',
      url: '/test',
    });

    const host = {
      switchToHttp: jest.fn().mockReturnThis(),
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(mockStatusFn).toHaveBeenCalledWith(mockStatus);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: mockStatus,
        message: 'Not Found',
        path: '/test',
      }),
    );
  });
});
