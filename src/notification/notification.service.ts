import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import type { Member } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private firebaseInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    try {
      if (admin.apps.length) {
        this.firebaseInitialized = true;
        return;
      }

      const serviceAccount = this.loadServiceAccount();
      if (!serviceAccount) {
        this.logger.warn(
          'FIREBASE_SERVICE_ACCOUNT_PATH 또는 FIREBASE_SERVICE_ACCOUNT_JSON이 설정되지 않아 FCM이 비활성화됩니다.',
        );
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.firebaseInitialized = true;
      this.logger.log('Firebase Admin SDK 초기화 완료');
    } catch (e) {
      this.logger.error('Firebase Admin SDK 초기화 실패', e);
    }
  }

  private loadServiceAccount(): admin.ServiceAccount | null {
    // 1순위: 파일 경로 (예: secrets/firebase-service-account.json)
    const filePath = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    if (filePath) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      const raw = fs.readFileSync(path.resolve(filePath), 'utf-8');
      return JSON.parse(raw) as admin.ServiceAccount;
    }

    // 2순위: 인라인 JSON 문자열
    const json = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (json) {
      return JSON.parse(json) as admin.ServiceAccount;
    }

    return null;
  }

  // ─── FCM 토큰 등록 ────────────────────────────────────────────────────────────

  async registerFcmToken(fcmToken: string, member: Member) {
    const existing = await this.prisma.fcmToken.findFirst({
      where: { memberId: member.id },
    });

    if (existing) {
      await this.prisma.fcmToken.update({
        where: { id: existing.id },
        data: { fcmToken, active: true, updatedAt: new Date() },
      });
    } else {
      await this.prisma.fcmToken.create({
        data: {
          memberId: member.id,
          fcmToken,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }

  // ─── 특정 멤버에게 푸시 전송 ──────────────────────────────────────────────────

  async sendPushNotification(title: string, body: string, member: Member) {
    const tokenRecord = await this.prisma.fcmToken.findFirst({
      where: { memberId: member.id, active: true },
    });
    if (!tokenRecord?.fcmToken) return;
    await this.sendMessage(tokenRecord.fcmToken, title, body);
  }

  // ─── 특정 토큰으로 직접 전송 ─────────────────────────────────────────────────

  async sendMessage(token: string, title: string, body: string) {
    if (!this.firebaseInitialized) {
      this.logger.warn('Firebase 미초기화 상태에서 FCM 전송 시도');
      return;
    }

    try {
      await admin.messaging().send({ token, notification: { title, body } });
    } catch (e) {
      this.logger.error(`FCM 전송 실패 (token: ${token.slice(0, 10)}...)`, e);
    }
  }

  // ─── 스케줄러: 9시/15시/21시 루틴 알림 ───────────────────────────────────────

  @Cron('0 0 9,15,21 * * *')
  async sendRoutineNotification() {
    const hour = new Date().getHours();
    let title: string;
    let body: string;

    if (hour === 9) {
      title = '🌅 아침이 밝았어요!';
      body = '아침 해가 밝았어요! 오늘의 루틴을 시작해볼까요?';
    } else if (hour === 15) {
      title = '☀️ 나른한 오후예요';
      body = '나른한 오후... 루틴으로 기분 전환은 어때요?';
    } else {
      title = '🌙 오늘 하루도 수고하셨어요!';
      body = '저녁 루틴을 완료하면 더 뿌듯한 하루가 될 거예요!';
    }

    // 오늘 미완료 루틴이 있는 멤버에게만 전송
    const membersWithIncomplete = await this.prisma.member.findMany({
      where: {
        routines: {
          some: { isEnded: false, isSuspended: false, isAchieved: false },
        },
        fcmTokens: { some: { active: true } },
      },
      include: { fcmTokens: { where: { active: true }, take: 1 } },
    });

    for (const member of membersWithIncomplete) {
      const token = member.fcmTokens[0]?.fcmToken;
      if (token) await this.sendMessage(token, title, body);
    }
  }
}
