import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ShareChannel {
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  COPY_LINK = 'copy_link',
  EMAIL = 'email',
}

export class SharePostDto {
  @ApiProperty({ enum: ShareChannel, example: ShareChannel.TWITTER })
  @IsEnum(ShareChannel)
  channel!: ShareChannel;
}
