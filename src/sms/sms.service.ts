import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const coolsms = require('coolsms-node-sdk').default;

const SMS_TTL_SECONDS = 180; // 3분

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly redis: Redis;
  private readonly messageService: any;
  private readonly fromNumber: string;

  constructor(private readonly config: ConfigService) {
    // Redis 초기화
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
    });

    // CoolSMS 초기화
    const apiKey = this.config.get<string>('COOLSMS_API_KEY', '');
    const apiSecret = this.config.get<string>('COOLSMS_API_SECRET', '');
    this.fromNumber = this.config.get<string>('COOLSMS_FROM_NUMBER', '');

    if (apiKey && apiSecret) {
      this.messageService = new coolsms(apiKey, apiSecret);
    } else {
      this.logger.warn(
        'COOLSMS_API_KEY / COOLSMS_API_SECRET가 설정되지 않아 SMS가 비활성화됩니다.',
      );
    }
  }

  // ─── 인증 코드 생성 + SMS 전송 ────────────────────────────────────────────────

  async sendSms(phoneNumber: string): Promise<void> {
    const code = this.generateCode();

    // Redis에 TTL 3분으로 저장
    await this.redis.setex(`sms:${phoneNumber}`, SMS_TTL_SECONDS, code);

    if (this.messageService) {
      try {
        await this.messageService.sendOne({
          to: phoneNumber,
          from: this.fromNumber,
          text: `[Sobok] 인증번호는 ${code} 입니다. 3분 내에 입력을 완료해주세요.`,
        });
      } catch (e) {
        this.logger.error(`SMS 전송 실패 (${phoneNumber})`, e);
        throw new BadRequestException('인증번호 전송에 실패했습니다.');
      }
    } else {
      // 개발 환경: 로그로 코드 출력
      this.logger.debug(`[개발용] ${phoneNumber} 인증코드: ${code}`);
    }
  }

  // ─── 인증 코드 검증 ──────────────────────────────────────────────────────────

  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`sms:${phoneNumber}`);
    if (!stored) return false;

    const isValid = stored === code;
    // 성공/실패 모두 즉시 삭제하여 brute-force 방지
    await this.redis.del(`sms:${phoneNumber}`);
    return isValid;
  }

  // ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

  private generateCode(): string {
    return String(require('crypto').randomInt(0, 1_000_000)).padStart(6, '0');
  }
}
