import { Injectable, NotFoundException } from '@nestjs/common';
import type { Member } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface DailyAchieveDto {
  date: string;
  status: string;
}

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 기간별 일일 달성도 ──────────────────────────────────────────────────────

  async getDailyAchieve(
    member: Member,
    startDate: string,
    endDate: string,
  ): Promise<DailyAchieveDto[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const records = await this.prisma.dailyAchieve.findMany({
      where: { memberId: member.id, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });

    return records.map((r) => ({
      date: r.date ? r.date.toISOString().split('T')[0] : '',
      status: r.status ?? 'NO_ROUTINE',
    }));
  }

  // ─── 루틴별 기간 달성도 ──────────────────────────────────────────────────────

  async getDailyRoutineAchieve(
    routineId: number,
    startDate: string,
    endDate: string,
  ) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
      include: { routineDays: true },
    });
    if (!routine)
      throw new NotFoundException('해당 ID의 루틴이 존재하지 않습니다.');

    const routineDayNames = routine.routineDays.map((d) => d.day);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result: Array<{ date: string; status: string }> = [];

    const cur = new Date(start);
    while (cur <= end) {
      const dayName = this.getKoreanDayOfWeek(cur);
      const isRoutineDay = routineDayNames.includes(dayName as any);

      if (!isRoutineDay) {
        result.push({
          date: cur.toISOString().split('T')[0],
          status: 'NO_ROUTINE',
        });
      } else {
        const nextDay = new Date(cur);
        nextDay.setDate(nextDay.getDate() + 1);

        const logs = await this.prisma.routineLog.findMany({
          where: {
            routineId,
            endTime: { gte: cur, lt: nextDay },
          },
        });

        result.push({
          date: cur.toISOString().split('T')[0],
          status: logs.length === 0 ? 'NONE_ACHIEVED' : 'ACHIEVED',
        });
      }

      cur.setDate(cur.getDate() + 1);
    }

    return result;
  }

  // ─── 날짜별 달성 로그 (완료된 루틴 목록) ─────────────────────────────────────

  async getDailyAchieveLog(member: Member, date: string) {
    const localDate = new Date(date);
    const nextDay = new Date(localDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const routineLogs = await this.prisma.routineLog.findMany({
      where: {
        isCompleted: true,
        endTime: { gte: localDate, lt: nextDay },
        routine: { memberId: member.id },
      },
      include: { routine: { include: { account: true } } },
    });

    return routineLogs.map((rl) => ({
      title: rl.routine.title,
      accountTitle: rl.routine.account?.title ?? null,
      duration: rl.duration?.toString(),
      startTime: rl.startTime,
      endTime: rl.endTime,
      linkApp: rl.routine.linkApp,
    }));
  }

  // ─── 루틴별 날짜 달성 로그 ───────────────────────────────────────────────────

  async getDailyRoutineAchieveLog(routineId: number, date: string) {
    const localDate = new Date(date);
    const nextDay = new Date(localDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!routine) throw new NotFoundException('루틴을 찾을 수 없습니다.');

    const logs = await this.prisma.routineLog.findMany({
      where: { routineId, endTime: { gte: localDate, lt: nextDay } },
    });

    return logs.map((l) => ({
      title: routine.title,
      linkApp: routine.linkApp,
      duration: l.duration?.toString(),
      startTime: l.startTime,
      endTime: l.endTime,
    }));
  }

  // ─── 기간별 누적 시간 + 달성일 수 ───────────────────────────────────────────

  async getDateTimeStatistics(
    member: Member,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const endPlusOne = new Date(end);
    endPlusOne.setDate(endPlusOne.getDate() + 1);

    const routineLogs = await this.prisma.routineLog.findMany({
      where: {
        isCompleted: true,
        endTime: { gte: start, lt: endPlusOne },
        routine: { memberId: member.id },
      },
    });

    const totalDuration = routineLogs.reduce(
      (sum, rl) => sum + Number(rl.duration ?? 0),
      0,
    );

    const dailyAchieves = await this.prisma.dailyAchieve.findMany({
      where: {
        memberId: member.id,
        date: { gte: start, lte: end },
        status: { in: ['ALL_ACHIEVED', 'SOME_ACHIEVED'] },
      },
    });

    return { totalDuration, totalAchievedCount: dailyAchieves.length };
  }

  // ─── 루틴별 이번 주 통계 ─────────────────────────────────────────────────────

  async getRoutineTimeStatistics(routineId: number) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!routine) throw new NotFoundException('루틴을 찾을 수 없습니다.');

    const logs = await this.prisma.routineLog.findMany({
      where: {
        routineId,
        isCompleted: true,
        endTime: { gte: monday, lt: sunday },
      },
    });

    const totalDuration = logs.reduce(
      (sum, l) => sum + Number(l.duration ?? 0),
      0,
    );
    return { totalDuration, totalAchievedCount: logs.length };
  }

  // ─── DayOfWeek 헬퍼 ─────────────────────────────────────────────────────────

  getKoreanDayOfWeek(date: Date): string {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  }
}
