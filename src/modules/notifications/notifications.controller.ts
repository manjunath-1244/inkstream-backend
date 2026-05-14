import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Notification } from './entities/notification.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiOkResponse({
    type: [Notification],
    description: 'Returns paginated list of notifications',
  })
  findAll(@CurrentUser() user: any, @Query() paginationDto: PaginationDto) {
    return this.notificationsService.findAll(user.id, paginationDto);
  }

  @Get('unread-count')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiOkResponse({
    type: Number,
    description: 'Returns the number of unread notifications',
  })
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiOkResponse({ description: 'Notification marked as read' })
  markAsRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('mark-all-read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({ description: 'All notifications marked as read' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
