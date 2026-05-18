import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('DatabaseException');

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Log the error to the terminal
    this.logger.error(
      `${request.method} ${request.url} - Database Error: ${exception.message}`,
    );

    // PostgreSQL unique violation
    if ((exception as any).code === '23505') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return response.status(409).json({
        statusCode: 409,
        message: 'Duplicate entry',
        timestamp: new Date().toISOString(),
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.status(500).json({
      statusCode: 500,
      message: 'Database error',
      timestamp: new Date().toISOString(),
    });
  }
}
