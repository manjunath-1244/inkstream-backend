import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ReportTargetType } from '../entities/report.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType, example: ReportTargetType.POST })
  @IsEnum(ReportTargetType)
  @IsNotEmpty()
  targetType!: ReportTargetType;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The UUID of the content being reported',
  })
  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @ApiProperty({ example: 'Inappropriate content' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
