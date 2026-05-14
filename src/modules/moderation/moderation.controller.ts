import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { AdminService } from '../admin/admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';

class SuspendUserDto {
  @ApiProperty({ example: 24, description: 'Duration of suspension in hours' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  durationHours!: number;
}

@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModerationController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users/:id/suspend')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Suspend a user (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOkResponse({ description: 'User suspended successfully' })
  suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.suspendUser(id, admin.id, dto.durationHours || 24);
  }

  @Post('posts/:id/hide')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Hide a post (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOkResponse({ description: 'Post hidden successfully' })
  hidePost(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() admin: any) {
    return this.adminService.hidePost(id, admin.id);
  }
}
