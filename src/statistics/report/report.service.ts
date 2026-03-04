import { Injectable, Logger } from '@nestjs/common';
import type { Member } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { StatisticsService, DailyAchieveDto } from '../statistics.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly statisticsService: StatisticsService,
  ) {}

  // ─── 월간 리포트 ─────────────────────────────────────────────────────────────

  async getReport(member: Member, yearMonth: string) {
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    const prevMonth =
      month === 1
        ? `${year - 1}-12`
        : `${year}-${String(month - 1).padStart(2, '0')}`;
    const [py, pm] = prevMonth.split('-').map(Number);
    const prevStart = new Date(py, pm - 1, 1);
    const prevEnd = new Date(py, pm, 0);

    const monthlyReport = await this.prisma.monthlyUserReport.findFirst({
      where: { memberId: member.id, targetYearMonth: yearMonth },
    });
    const prevMonthlyReport = await this.prisma.monthlyUserReport.findFirst({
      where: { memberId: member.id, targetYearMonth: prevMonth },
    });

    if (!monthlyReport)
      return { message: '이번 달의 통계가 존재하지 않습니다.' };
    if (!prevMonthlyReport)
      return { message: '지난 달의 통계가 존재하지 않습니다.' };

    const result = await this.statisticsService.getDailyAchieve(
      member,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
    );
    const resultPrevious = await this.statisticsService.getDailyAchieve(
      member,
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0],
    );

    const totalAccumulatedTime = Number(
      monthlyReport.totalAccumulatedTime ?? 0,
    );
    const totalAchievedCount = this.getTotalAchievedCount(result);
    const mostPerformedStartTime = await this.getMostPerformedStartTime(
      member,
      startDate,
      endDate,
    );

    const response: Record<string, any> = {
      // 1페이지
      totalTime: totalAccumulatedTime,
      totalTimePercent: await this.getTotalTimePercent(member, yearMonth),
      routineStatistics: await this.getMonthlyRoutineStatistics(
        member,
        startDate,
        endDate,
      ),
      accountStatistics: await this.getMonthlyAccountStatistics(
        member,
        startDate,
        endDate,
      ),
      reportMessage1: this.getReportMessage1(totalAccumulatedTime),
      // 2페이지
      averageTime: Number(monthlyReport.averageAccumulatedTime ?? 0),
      averageTimeCompare: await this.getAverageTimeCompare(member, yearMonth),
      mostPerformedStartTime,
      ...(mostPerformedStartTime !== 'none' && {
        reportMessage2: this.getReportMessage2(
          mostPerformedStartTime,
          member.displayName ?? '',
        ),
      }),
      // 3페이지
      totalAchievedCount,
      totalAchievedPercent: this.getTotalAchievedPercent(result),
      dailyAchieve: result,
      reportMessage3: this.getReportMessage3(totalAchievedCount, month),
      // 4페이지
      consecutiveAchieveCount: this.calculateMonthlyConsecutiveAchieve(result),
      // 5페이지
      mostAchievedAccount: await this.getMonthlyMostAchievedAccount(
        member,
        startDate,
        endDate,
      ),
      previousMostAchievedAccount: await this.getMonthlyMostAchievedAccount(
        member,
        prevStart,
        prevEnd,
      ),
      previousConsecutiveAchieveCount:
        this.calculateMonthlyConsecutiveAchieve(resultPrevious),
      // 6페이지
      previousTotalTime: Number(prevMonthlyReport.totalAccumulatedTime ?? 0),
      previousAverageTime: Number(
        prevMonthlyReport.averageAccumulatedTime ?? 0,
      ),
      // 7페이지
      previousTotalAchievedCount: this.getTotalAchievedCount(resultPrevious),
      previousDailyAchieve: resultPrevious,
    };

    return response;
  }

  // ─── 스케줄러: 매월 1일 00:30 - 전월 MonthlyUserReport 생성 ─────────────────

  @Cron('30 0 1 * *')
  async generateMonthlyReportScheduler() {
    const now = new Date();
    const prevYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const targetYearMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    const startDate = new Date(prevYear, prevMonth - 1, 1);
    const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    const members = await this.prisma.member.findMany({ select: { id: true } });

    for (const { id: memberId } of members) {
      try {
        const existing = await this.prisma.monthlyUserReport.findFirst({
          where: { memberId, targetYearMonth },
        });
        if (existing) continue;

        const logs = await this.prisma.routineLog.findMany({
          where: {
            isCompleted: true,
            endTime: { gte: startDate, lte: endDate },
            routine: { memberId },
          },
        });

        const totalAccumulatedTime = logs.reduce(
          (s, l) => s + Number(l.duration ?? 0),
          0,
        );
        const days = endDate.getDate();
        const averageAccumulatedTime = Math.round(totalAccumulatedTime / days);

        await this.prisma.monthlyUserReport.create({
          data: {
            memberId,
            targetYearMonth,
            totalAccumulatedTime,
            averageAccumulatedTime,
          },
        });
      } catch (e) {
        this.logger.error(`memberId=${memberId} 월간 리포트 생성 실패`, e);
      }
    }
  }

  // ─── 스케줄러: 매일 23:59 - DailyAchieve 상태 기록 ──────────────────────────

  @Cron('59 23 * * *')
  async updateDailyAchieveScheduler() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayName = this.statisticsService.getKoreanDayOfWeek(today);

    const members = await this.prisma.member.findMany({ select: { id: true } });

    for (const { id: memberId } of members) {
      try {
        const routinesToday = await this.prisma.routine.findMany({
          where: {
            memberId,
            isEnded: false,
            isSuspended: false,
            routineDays: { some: { day: dayName as any } },
          },
        });

        let status: string;
        if (routinesToday.length === 0) {
          status = 'NO_ROUTINE';
        } else {
          const achievedCount = routinesToday.filter(
            (r) => r.isAchieved,
          ).length;
          if (achievedCount === 0) status = 'NONE_ACHIEVED';
          else if (achievedCount === routinesToday.length)
            status = 'ALL_ACHIEVED';
          else status = 'SOME_ACHIEVED';
        }

        const existing = await this.prisma.dailyAchieve.findFirst({
          where: { memberId, date: today },
        });

        if (existing) {
          await this.prisma.dailyAchieve.update({
            where: { id: existing.id },
            data: { status },
          });
        } else {
          await this.prisma.dailyAchieve.create({
            data: { memberId, date: today, status },
          });
        }
      } catch (e) {
        this.logger.error(`memberId=${memberId} DailyAchieve 업데이트 실패`, e);
      }
    }
  }

  // ─── 유틸리티 메서드 ─────────────────────────────────────────────────────────

  getTotalAchievedCount(result: DailyAchieveDto[]): number {
    return result.filter(
      (d) => d.status === 'ALL_ACHIEVED' || d.status === 'SOME_ACHIEVED',
    ).length;
  }

  getTotalAchievedPercent(result: DailyAchieveDto[]): number {
    const routineDays = result.filter((d) => d.status !== 'NO_ROUTINE').length;
    if (routineDays === 0) return 0;
    const percent = (this.getTotalAchievedCount(result) / routineDays) * 100;
    return Math.round(percent * 10) / 10;
  }

  calculateMonthlyConsecutiveAchieve(dailyAchieves: DailyAchieveDto[]): number {
    let streak = 0;
    let maxStreak = 0;

    for (const dto of dailyAchieves) {
      if (dto.status === 'ALL_ACHIEVED' || dto.status === 'SOME_ACHIEVED') {
        streak++;
      } else if (dto.status === 'NO_ROUTINE') {
        continue;
      } else {
        streak = 0;
      }
      if (streak > maxStreak) maxStreak = streak;
    }
    return maxStreak;
  }

  // ─── 내부 헬퍼 ───────────────────────────────────────────────────────────────

  private async getTotalTimePercent(
    member: Member,
    yearMonth: string,
  ): Promise<number> {
    const allReports = await this.prisma.monthlyUserReport.findMany({
      where: { targetYearMonth: yearMonth },
      orderBy: { totalAccumulatedTime: 'desc' },
    });
    const memberReport = allReports.find((r) => r.memberId === member.id);
    if (!memberReport) return 0;

    const rank = allReports.findIndex((r) => r.memberId === member.id) + 1;
    return Math.round((rank / allReports.length) * 100 * 10) / 10;
  }

  private async getAverageTimeCompare(
    member: Member,
    yearMonth: string,
  ): Promise<number> {
    const allReports = await this.prisma.monthlyUserReport.findMany();
    const avgAll =
      allReports.reduce(
        (s, r) => s + Number(r.averageAccumulatedTime ?? 0),
        0,
      ) / (allReports.length || 1);
    const memberReport = await this.prisma.monthlyUserReport.findFirst({
      where: { memberId: member.id, targetYearMonth: yearMonth },
    });
    return Math.round(
      Number(memberReport?.averageAccumulatedTime ?? 0) - avgAll,
    );
  }

  private async getMostPerformedStartTime(
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
    });

    const timeCount = new Map<string, number>();
    for (const log of logs) {
      if (!log.startTime) continue;
      const rounded = this.roundToHalfHour(log.startTime);
      timeCount.set(rounded, (timeCount.get(rounded) ?? 0) + 1);
    }

    if (timeCount.size === 0) return 'none';
    return [...timeCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  private roundToHalfHour(date: Date): string {
    const h = date.getHours();
    const m = date.getMinutes();
    if (m < 15) return `${String(h).padStart(2, '0')}:00`;
    if (m < 45) return `${String(h).padStart(2, '0')}:30`;
    const nextH = (h + 1) % 24;
    return `${String(nextH).padStart(2, '0')}:00`;
  }

  private async getMonthlyRoutineStatistics(
    member: Member,
    start: Date,
    end: Date,
  ) {
    const endPlusOne = new Date(end);
    endPlusOne.setDate(end.getDate() + 1);

    const routines = await this.prisma.routine.findMany({
      where: { memberId: member.id },
    });
    const result = [];

    for (const routine of routines) {
      const logs = await this.prisma.routineLog.findMany({
        where: {
          routineId: routine.id,
          isCompleted: true,
          endTime: { gte: start, lt: endPlusOne },
        },
      });
      const duration = logs.reduce((s, l) => s + Number(l.duration ?? 0), 0);
      if (duration > 0) result.push({ title: routine.title, duration });
    }
    return result;
  }

  private async getMonthlyAccountStatistics(
    member: Member,
    start: Date,
    end: Date,
  ) {
    const endPlusOne = new Date(end);
    endPlusOne.setDate(end.getDate() + 1);

    const accounts = await this.prisma.account.findMany({
      where: { memberId: member.id },
    });
    const result = [];

    for (const account of accounts) {
      const logs = await this.prisma.accountLog.findMany({
        where: {
          accountId: account.id,
          createdAt: { gte: start, lt: endPlusOne },
        },
      });
      const duration = logs.reduce((s, l) => s + (l.depositTime ?? 0), 0);
      if (duration > 0) result.push({ title: account.title, duration });
    }
    return result;
  }

  private async getMonthlyMostAchievedAccount(
    member: Member,
    start: Date,
    end: Date,
  ) {
    const endPlusOne = new Date(end);
    endPlusOne.setDate(end.getDate() + 1);

    const accounts = await this.prisma.account.findMany({
      where: { memberId: member.id },
    });
    if (accounts.length === 0) return null;

    let maxDuration = 0;
    let bestAccount: any = accounts[0];

    for (const account of accounts) {
      const logs = await this.prisma.accountLog.findMany({
        where: {
          accountId: account.id,
          createdAt: { gte: start, lt: endPlusOne },
        },
      });
      const duration = logs.reduce((s, l) => s + (l.depositTime ?? 0), 0);
      if (duration > maxDuration) {
        maxDuration = duration;
        bestAccount = account;
      }
    }

    return { title: bestAccount.title, duration: maxDuration };
  }

  private getReportMessage1(totalTime: number): string {
    if (totalTime >= 3600)
      return '세상에에! 폭설이에요! 세상이 온통 하얀색이네요!';
    if (totalTime >= 2400)
      return '눈이 정말 많이 내렸어요! 눈사람 여러개를 만들 수 있을 정도로요!';
    if (totalTime >= 1200)
      return '이번 달은 눈 녹을 걱정이 없었어요! 대단해요!';
    if (totalTime >= 600)
      return '조금씩 내리는 눈이 예뻤던 한달이에요! 눈 내리는 날이 얼마나 소중했는지!';
    return '이번 달은 따뜻했나봐요! 다음 달에는 더 많은 눈이 내리겠죠 ?';
  }

  private getReportMessage2(startTime: string, displayName: string): string {
    const [h] = startTime.split(':').map(Number);
    if (h >= 6 && h < 12)
      return `${displayName}님 덕분에 아침부터 예쁜 눈을 볼 수 있었어요!`;
    if (h >= 12 && h < 18)
      return `나른한 오후, ${displayName}님 덕분에 눈이 내리네요! 소소한 기분 전환, 최고에요!`;
    if (h >= 18) return `저녁까지 힘차게 눈이 내리네요! 오늘도 수고하셨습니다!`;
    return `고요한 밤에 예쁜 눈이 내리네요! ${displayName}님의 노력이 조용히 쌓이고 있군요!`;
  }

  private getReportMessage3(count: number, month: number): string {
    if (count >= 21) return `매일 눈이 내렸던 ${month}월이라니! 대단해요!!`;
    if (count >= 11)
      return `눈이 꾸준히 내렸던 ${month}월이네요! 수고하셨어요!`;
    if (count >= 6)
      return `눈 내리는 날이 소중했던 ${month}월이네요! 소중한 날들을 모아모아!`;
    return `맑은 날이 많았던 ${month}월이네요! 눈 내리는 날이 많아졌으면 좋겠어요:)`;
  }
}
