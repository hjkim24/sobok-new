import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FcmMessageDto {
  @ApiPropertyOptional({ example: 'device_fcm_token_here' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({ example: '알림 제목' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '알림 내용' })
  @IsOptional()
  @IsString()
  body?: string;
}
