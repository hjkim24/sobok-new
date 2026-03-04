import { Injectable, Logger } from '@nestjs/common';
import type { Member } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StatisticsService } from '../statistics.service';
import { ReportService } from '../report/report.service';

@Injectable()
export class SnowCardService {
  private readonly logger = new Logger(SnowCardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly statisticsService: StatisticsService,
    private readonly reportService: ReportService,
  ) {}

  // ─── 눈 카드 뽑기 ────────────────────────────────────────────────────────────

  async getSnowCard(
    member: Member,
    yearMonth: string,
  ): Promise<Record<string, string>> {
    try {
      const [year, month] = yearMonth.split('-').map(Number);

      const existing = await this.prisma.snowCard.findFirst({
        where: { memberId: member.id, targetYearMonth: yearMonth },
      });
      if (existing) return { snowCard: existing.snowCard ?? 'basic' };

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      const startISO = startOfMonth.toISOString().split('T')[0];
      const endISO = endOfMonth.toISOString().split('T')[0];

      const snowCards: string[] = [];

      this.tryAdd(snowCards, 'hexagon', () => this.isHexagon(member));
      this.tryAdd(snowCards, 'like', () =>
        this.isLike(member, startISO, endISO),
      );
      this.tryAdd(snowCards, 'rolyPoly', () =>
        this.isRolyPoly(member, startISO, endISO),
      );
      this.tryAdd(snowCards, 'beaker', () =>
        this.isBeaker(member, startOfMonth, endOfMonth),
      );
      this.tryAdd(snowCards, 'fairy', () =>
        this.isFairy(member, startOfMonth, endOfMonth),
      );
      this.tryAdd(snowCards, 'crab', () =>
        this.isCrab(member, startOfMonth, endOfMonth),
      );
      this.tryAdd(snowCards, 'spring', () => this.isSpring(member));
      this.tryAdd(snowCards, 'donut', () => this.isDonut(member));

      // angel, pudding - 단일 루틴/linkApp 기반
      await this.tryAddAsync(snowCards, 'angel', () =>
        this.isAngel(member, startOfMonth, endOfMonth),
      );
      await this.tryAddAsync(snowCards, 'pudding', () =>
        this.isPudding(member, startOfMonth, endOfMonth),
      );

      // 달 카드
      try {
        const moon = await this.getMoon(member, startISO, endISO);
        if (moon) snowCards.push(moon);
      } catch (e) {
        this.logger.error('달 카드 조회 오류', e);
      }

      // 가장 많이 수행한 linkApp 기반 카드
      try {
        const linkAppCard = await this.getMostPerformedLinkApp(
          member,
          startOfMonth,
          endOfMonth,
        );
        if (linkAppCard && linkAppCard !== 'none') snowCards.push(linkAppCard);
      } catch (e) {
        this.logger.error('linkApp 카드 조회 오류', e);
      }

      // 2025년 한정 뱀 카드
      if (year === 2025) snowCards.push('snake');

      if (snowCards.length === 0) snowCards.push('basic');

      const card = snowCards[Math.floor(Math.random() * snowCards.length)];

      try {
        await this.prisma.snowCard.create({
          data: {
            memberId: member.id,
            targetYearMonth: yearMonth,
            snowCard: card,
          },
        });
      } catch (e) {
        this.logger.error('눈 카드 저장 실패', e);
      }

      return { snowCard: card };
    } catch (e) {
      this.logger.error('눈 카드 생성 오류', e);
      return {
        snowCard: 'basic',
        error: '눈 카드 생성 중 오류가 발생했습니다.',
      };
    }
  }

  // ─── 전체 눈 카드 목록 ───────────────────────────────────────────────────────

  async getAllSnowCards(member: Member) {
    const cards = await this.prisma.snowCard.findMany({
      where: { memberId: member.id },
      orderBy: { id: 'desc' },
    });
    return cards.map((c) => ({
      yearMonth: c.targetYearMonth,
      snowCard: c.snowCard,
    }));
  }

  // ─── 카드 조건들 ─────────────────────────────────────────────────────────────

  // 6개 이상의 루틴 보유
  private isHexagon(member: Member): boolean {
    return (member as any).routines?.length > 6;
  }

  // 가장 많이 수행한 linkApp (null이면 "none")
  private async getMostPerformedLinkApp(
    member: Member,
    start: Date,
    end: Date,
  ): Promise<string> {
    const logs = await this.prisma.routineLog.findMany({
      where: {
        isCompleted: true,
        endTime: { gte: start, lte: end },
        routine: { memberId: member.id },
      },
      include: { routine: { select: { linkApp: true } } },
    });

    const counts = new Map<string, number>();
    for (const log of logs) {
      const app = log.routine.linkApp;
      if (app) counts.set(app, (counts.get(app) ?? 0) + 1);
    }
    if (counts.size === 0) return 'none';
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  // 달성률 기반 달 카드
  private async getMoon(
    member: Member,
    startISO: string,
    endISO: string,
  ): Promise<string> {
    const result = await this.statisticsService.getDailyAchieve(
      member,
      startISO,
      endISO,
    );
    const percent = this.reportService.getTotalAchievedPercent(result);
    if (percent === 100) return 'full';
    if (percent >= 50) return 'half';
    if (percent >= 25) return 'quarter';
    return 'cloud';
  }

  // 월 연속 달성 15일 이상
  private async isLike(
    member: Member,
    startISO: string,
    endISO: string,
  ): Promise<boolean> {
    const result = await this.statisticsService.getDailyAchieve(
      member,
      startISO,
      endISO,
    );
    return this.reportService.calculateMonthlyConsecutiveAchieve(result) >= 15;
  }

  // 14일 이상 공백 후 재시작
  private async isRolyPoly(
    member: Member,
    startISO: string,
    endISO: string,
  ): Promise<boolean> {
    const result = await this.statisticsService.getDailyAchieve(
      member,
      startISO,
      endISO,
    );
    let lastAchievedDate: Date | null = null;

    for (const dto of result) {
      if (dto.status === 'ALL_ACHIEVED' || dto.status === 'SOME_ACHIEVED') {
        const cur = new Date(dto.date);
        if (lastAchievedDate) {
          const gap =
            (cur.getTime() - lastAchievedDate.getTime()) /
            (1000 * 60 * 60 * 24);
          if (gap >= 14) return true;
        }
        lastAchievedDate = cur;
      }
    }
    return false;
  }

  // 이번 달 새 카테고리 생성
  private async isBeaker(
    member: Member,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    const categories = await this.prisma.category.findMany({
      where: { memberId: member.id, createdAt: { gte: start, lte: end } },
    });
    return categories.length > 0;
  }

  // 단 1개의 linkApp만 사용
  private async isAngel(
    member: Member,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    const logs = await this.prisma.routineLog.findMany({
      where: {
        isCompleted: true,
        endTime: { gte: start, lte: end },
        routine: { memberId: member.id },
      },
      include: { routine: { select: { linkApp: true } } },
    });
    if (logs.length === 0) return false;
    const apps = new Set(logs.map((l) => l.routine.linkApp).filter(Boolean));
    return apps.size === 1;
  }

  // 단 1개의 루틴만 완료
  private async isPudding(
    member: Member,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    const logs = await this.prisma.routineLog.findMany({
      where: {
        isCompleted: true,
        endTime: { gte: start, lte: end },
        routine: { memberId: member.id },
      },
    });
    if (logs.length === 0) return false;
    const routines = new Set(logs.map((l) => l.routineId));
    return routines.size === 1;
  }

  // AI 루틴만 진행
  private async isFairy(
    member: Member,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    const logs = await this.prisma.routineLog.findMany({
      where: {
        isCompleted: true,
        endTime: { gte: start, lte: end },
        routine: { memberId: member.id },
      },
      include: { routine: { select: { isAiRoutine: true } } },
    });
    if (logs.length === 0) return false;
    return logs.every((l) => l.routine.isAiRoutine === true);
  }

  // 자율 루틴만 진행
  private async isCrab(
    member: Member,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    const logs = await this.prisma.routineLog.findMany({
      where: {
        isCompleted: true,
        endTime: { gte: start, lte: end },
        routine: { memberId: member.id },
      },
      include: { routine: { select: { isAiRoutine: true } } },
    });
    if (logs.length === 0) return false;
    return logs.every((l) => !l.routine.isAiRoutine);
  }

  // 단일 계좌에 30000 이상 누적 입금
  private async isSpring(member: Member): Promise<boolean> {
    const accounts = await this.prisma.account.findMany({
      where: { memberId: member.id },
    });
    for (const account of accounts) {
      if (account.balance >= 30000) return true;
    }
    return false;
  }

  // 지난 달 계좌 만료
  private async isDonut(member: Member): Promise<boolean> {
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const accounts = await this.prisma.account.findMany({
      where: { memberId: member.id },
    });
    return accounts.some((a) => {
      if (!a.expiredAt) return false;
      return a.expiredAt >= prevMonthStart && a.expiredAt <= prevMonthEnd;
    });
  }

  // ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

  private tryAdd(
    list: string[],
    name: string,
    fn: () => boolean | Promise<boolean>,
  ) {
    try {
      const result = fn();
      if (result instanceof Promise) return; // async는 tryAddAsync 사용
      if (result) list.push(name);
    } catch (e) {
      this.logger.error(`${name} 카드 조건 오류`, e);
    }
  }

  private async tryAddAsync(
    list: string[],
    name: string,
    fn: () => Promise<boolean>,
  ) {
    try {
      if (await fn()) list.push(name);
    } catch (e) {
      this.logger.error(`${name} 카드 조건 오류`, e);
    }
  }
}
