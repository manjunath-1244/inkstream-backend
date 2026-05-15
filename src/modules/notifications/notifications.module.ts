import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsListener } from './notifications.listener';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), UsersModule],
  providers: [NotificationsService, NotificationsListener],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
