import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION')!,
      endpoint: this.configService.get<string>('S3_ENDPOINT')!,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY')!,
      },
      forcePathStyle: true, // Required for MinIO 
    });
    this.bucket = this.configService.get<string>('S3_BUCKET')!;
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error: any) {
      // For MinIO/S3, if the bucket doesn't exist, it throws a specific error
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          console.log(`Bucket "${this.bucket}" created successfully.`);
        } catch (createError: any) {
          console.error(`Failed to create bucket "${this.bucket}": ${createError.message}`);
        }
      } else {
        console.error(`Error checking bucket "${this.bucket}": ${error.message}`);
      }
    }
  }

  async getPresignedUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 300 }); // 5 minutes expiry time. after 5 minutes user can't upload the file.
  }
}
