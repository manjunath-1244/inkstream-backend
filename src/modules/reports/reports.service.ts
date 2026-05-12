import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  async create(reporterId: string, createReportDto: CreateReportDto) {
    const report = this.reportRepo.create({
      reporterId,
      ...createReportDto,
    });
    return this.reportRepo.save(report);
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.reportRepo.findAndCount({
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async updateStatus(id: string, status: ReportStatus) {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    report.status = status;
    return this.reportRepo.save(report);
  }
}
