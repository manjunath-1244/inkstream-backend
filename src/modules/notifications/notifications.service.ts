import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  async create(data: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    targetId?: string;
  }) {
    // Avoid notifying yourself
    if (data.recipientId === data.actorId) return null;

    const notification = this.notificationsRepo.create(data);
    const savedNotification = await this.notificationsRepo.save(notification);

    // Send email notification
    const recipient = await this.usersService.findById(data.recipientId);
    if (recipient && recipient.email) {
      await this.mailService.sendNotificationEmail(
        recipient.email,
        `You have a new ${data.type.replace(/_/g, ' ').toLowerCase()} notification on InkStream.`,
        data.type,
      );
    }

    return savedNotification;
  }

  async findAll(userId: string, paginationDto: PaginationDto) {
    const page = paginationDto.page ? parseInt(paginationDto.page as any) : 1;
    const limit = paginationDto.limit
      ? parseInt(paginationDto.limit as any)
      : 10;
    const skip = (page - 1) * limit;

    const [items, total] = await this.notificationsRepo.findAndCount({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['actor'],
    });

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationsRepo.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    notification.isRead = true;
    return this.notificationsRepo.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepo.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationsRepo.count({
      where: { recipientId: userId, isRead: false },
    });
    return { count };
  }
}
