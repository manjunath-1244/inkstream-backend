import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TypeOrmExceptionFilter } from './typeorm-exception.filter';

describe('TypeOrmExceptionFilter', () => {
  let filter: TypeOrmExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeOrmExceptionFilter],
    }).compile();

    filter = module.get<TypeOrmExceptionFilter>(TypeOrmExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should return 409 for unique constraint violation (23505)', () => {
    const exception = new QueryFailedError('query', [], new Error('detail'));
    (exception as any).code = '23505';

    const mockJson = jest.fn();
    const mockStatusFn = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatusFn });
    const mockGetRequest = jest.fn().mockReturnValue({
      method: 'POST',
      url: '/test',
    });

    const host = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnThis(),
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(mockStatusFn).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: 'Duplicate entry',
      }),
    );
  });

  it('should return 500 for generic database error', () => {
    const exception = new QueryFailedError('query', [], new Error('detail'));
    (exception as any).code = '99999';

    const mockJson = jest.fn();
    const mockStatusFn = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatusFn });
    const mockGetRequest = jest.fn().mockReturnValue({
      method: 'POST',
      url: '/test',
    });

    const host = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnThis(),
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(mockStatusFn).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Database error',
      }),
    );
  });
});
