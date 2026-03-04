import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SmsRequestDto } from './dto/sms-request.dto';
import { MemberService } from '../member/member.service';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly memberService: MemberService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SMS 인증번호 전송' })
  async sendSms(@Body() dto: SmsRequestDto) {
    const isDuplicated = await this.memberService.isPhoneNumberDuplicated(
      dto.phoneNumber,
    );
    if (isDuplicated)
      throw new BadRequestException('이미 가입된 전화번호입니다.');

    await this.smsService.sendSms(dto.phoneNumber);
    return { message: '인증번호 전송 성공' };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SMS 인증번호 확인' })
  async verifyCode(@Body() dto: SmsRequestDto) {
    if (!dto.code) throw new BadRequestException('인증 코드가 필요합니다.');

    const success = await this.smsService.verifyCode(dto.phoneNumber, dto.code);
    if (!success)
      throw new BadRequestException('유효하지 않은 인증 코드입니다.');

    return { message: '인증 성공' };
  }
}
