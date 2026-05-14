import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
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
    return this.notificationsRepo.save(notification);
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
