import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ReportTargetType } from '../entities/report.entity';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  @IsNotEmpty()
  targetType!: ReportTargetType;

  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
