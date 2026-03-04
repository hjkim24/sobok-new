import {
  Controller,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Member } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentMember } from '../common/decorators/current-member.decorator';
import { NotificationService } from './notification.service';
import { FcmMessageDto } from './dto/fcm-message.dto';

@ApiTags('Notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fcm')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'FCM 토큰 등록' })
  @ApiQuery({ name: 'fcmToken', type: String })
  async registerFcmToken(
    @CurrentMember() member: Member,
    @Query('fcmToken') fcmToken: string,
  ) {
    await this.notificationService.registerFcmToken(fcmToken, member);
    return { message: 'FCM 토큰 등록 성공' };
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '푸시 알림 전송 (현재 멤버에게)' })
  async sendPushNotification(
    @CurrentMember() member: Member,
    @Body() dto: FcmMessageDto,
  ) {
    await this.notificationService.sendPushNotification(
      dto.title ?? '알림',
      dto.body ?? '',
      member,
    );
    return { message: '푸시 알림 전송 완료' };
  }

  @Post('send/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '테스트 푸시 알림 전송' })
  async sendPushNotificationTest(@Body() dto: FcmMessageDto) {
    if (!dto.token) return { message: 'token이 필요합니다.' };
    await this.notificationService.sendMessage(
      dto.token,
      dto.title ?? '테스트 알림',
      dto.body ?? '테스트 메시지입니다.',
    );
    return { message: '테스트 푸시 전송 완료' };
  }
}
