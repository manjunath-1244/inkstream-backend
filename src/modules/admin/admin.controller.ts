import { Controller, Get, Post, Patch, Body, Param, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.adminService.getStats();
  }

  @Post('users/:id/ban')
  @Roles(Role.ADMIN)
  banUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.banUser(id, admin.id);
  }

  @Get('audit-log')
  @Roles(Role.ADMIN)
  getAuditLog(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.auditService.findAll(page, limit);
  }

  @Patch('users/:id/suspend')
  @Roles(Role.ADMIN, Role.MODERATOR)
  suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('durationHours') durationHours: number,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.suspendUser(id, admin.id, durationHours || 24);
  }

  @Patch('posts/:id/hide')
  @Roles(Role.ADMIN, Role.MODERATOR)
  hidePost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.hidePost(id, admin.id);
  }
}
