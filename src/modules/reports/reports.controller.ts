import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportStatus, Report } from './entities/report.entity';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProperty,
  ApiQuery,
} from '@nestjs/swagger';

class UpdateReportStatusDto {
  @ApiProperty({ enum: ReportStatus, example: ReportStatus.RESOLVED })
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status!: ReportStatus;
}

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new report' })
  @ApiOkResponse({ type: Report, description: 'Report submitted successfully' })
  async create(
    @CurrentUser() user: any,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportsService.create(user.id, createReportDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reports (Admin/Moderator only)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ type: [Report], description: 'Returns list of reports' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reportsService.findAll(+page, +limit);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report status (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiOkResponse({
    type: Report,
    description: 'Report status updated successfully',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateStatus(id, dto.status);
  }
}
