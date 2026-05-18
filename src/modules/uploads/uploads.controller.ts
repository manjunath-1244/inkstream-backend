import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly s3Service: S3Service) {}

  @Get('presigned-url')
  @ApiOperation({ summary: 'Get a presigned URL for image upload' })
  @ApiQuery({ name: 'fileName', required: true })
  @ApiQuery({ name: 'fileType', required: true })
  async getPresignedUrl(
    @Query('fileName') fileName: string,
    @Query('fileType') fileType: string,
  ) {
    const extension = fileName.split('.').pop();
    const key = `uploads/${uuidv4()}.${extension}`;

    const url = await this.s3Service.getPresignedUrl(key, fileType);

    return {
      url,
      key,
    };
  }
}
