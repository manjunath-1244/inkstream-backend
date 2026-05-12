import { Controller, Post, Get, Patch, Body, Param, UseGuards, Query, ParseUUIDPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportStatus } from './entities/report.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(user.id, createReportDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR)
  @UseGuards(RolesGuard)
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reportsService.findAll(+page, +limit);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @UseGuards(RolesGuard)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ReportStatus,
  ) {
    return this.reportsService.updateStatus(id, status);
  }
}
