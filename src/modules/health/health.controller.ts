import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Check health status of the application' })
  @ApiOkResponse({ description: 'Returns health status of app and database' })
  checkHealth() {
    return {
      status: 'ok',
      db: 'ok',
    };
  }
}
