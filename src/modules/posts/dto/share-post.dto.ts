import { IsEnum, IsString } from 'class-validator';

export enum ShareChannel {
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  COPY_LINK = 'copy_link',
  EMAIL = 'email',
}

export class SharePostDto {
  @IsEnum(ShareChannel)
  channel!: ShareChannel;
}
