import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('General')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Basic hello world endpoint' })
  @ApiOkResponse({ description: 'Returns a greeting message' })
  getHello(): string {
    return this.appService.getHello();
  }
}
