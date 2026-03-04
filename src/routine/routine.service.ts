import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Member } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountService } from '../account/account.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { AchieveRoutineDto } from './dto/achieve-routine.dto';

@Injectable()
export class RoutineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountService,
  ) {}

  // ─── 루틴 생성 ───────────────────────────────────────────────────────────────

  async createRoutine(member: Member, dto: CreateRoutineDto) {
    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, memberId: member.id },
      });
      if (!account)
        throw new NotFoundException('연결할 계좌를 찾을 수 없습니다.');
      if (account.isExpired || account.isEnded)
        throw new BadRequestException(
          '종료/만료된 계좌에는 루틴을 연결할 수 없습니다.',
        );
    }

    return this.prisma.$transaction(async (tx) => {
      const routine = await tx.routine.create({
        data: {
          memberId: member.id,
          title: dto.title,
          startTime: dto.startTime ? this.parseTime(dto.startTime) : null,
          endTime: dto.endTime ? this.parseTime(dto.endTime) : null,
          duration: dto.duration ? BigInt(dto.duration) : null,
          linkApp: dto.linkApp,
          accountId: dto.accountId,
          isAiRoutine: dto.isAiRoutine ?? false,
          createdAt: new Date(),
        },
      });

      await tx.routineDay.createMany({
        data: dto.days.map((day) => ({ routineId: routine.id, day })),
      });

      return routine;
    });
  }

  // ─── 루틴 목록 조회 ──────────────────────────────────────────────────────────

  async getRoutines(member: Member, accountId?: number) {
    const where: any = { memberId: member.id, isEnded: false };
    if (accountId !== undefined) where.accountId = accountId;

    const routines = await this.prisma.routine.findMany({
      where,
      include: { routineDays: true },
      orderBy: { createdAt: 'desc' },
    });

    return routines.map((r) => this.formatRoutine(r));
  }

  // ─── 루틴 단건 조회 ──────────────────────────────────────────────────────────

  async getRoutineById(member: Member, routineId: number) {
    const routine = await this.findRoutineOrThrow(member.id, routineId);
    return this.formatRoutine(routine);
  }

  // ─── 루틴 수정 ───────────────────────────────────────────────────────────────

  async updateRoutine(
    member: Member,
    routineId: number,
    dto: UpdateRoutineDto,
  ) {
    const routine = await this.findRoutineOrThrow(member.id, routineId);

    if (routine.isEnded)
      throw new BadRequestException('종료된 루틴은 수정할 수 없습니다.');

    if (dto.accountId !== undefined) {
      if (dto.accountId !== null) {
        const account = await this.prisma.account.findFirst({
          where: { id: dto.accountId, memberId: member.id },
        });
        if (!account)
          throw new NotFoundException('연결할 계좌를 찾을 수 없습니다.');
        if (account.isExpired || account.isEnded)
          throw new BadRequestException(
            '종료/만료된 계좌에는 루틴을 연결할 수 없습니다.',
          );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.routine.update({
        where: { id: routineId },
        data: {
          ...(dto.title && { title: dto.title }),
          ...(dto.startTime !== undefined && {
            startTime: dto.startTime ? this.parseTime(dto.startTime) : null,
          }),
          ...(dto.endTime !== undefined && {
            endTime: dto.endTime ? this.parseTime(dto.endTime) : null,
          }),
          ...(dto.duration !== undefined && {
            duration: dto.duration ? BigInt(dto.duration) : null,
          }),
          ...(dto.linkApp !== undefined && { linkApp: dto.linkApp }),
          ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        },
      });

      if (dto.days) {
        await tx.routineDay.deleteMany({ where: { routineId } });
        await tx.routineDay.createMany({
          data: dto.days.map((day) => ({ routineId, day })),
        });
      }
    });
  }

  // ─── 루틴 종료 ───────────────────────────────────────────────────────────────

  async endRoutine(member: Member, routineId: number) {
    const routine = await this.findRoutineOrThrow(member.id, routineId);
    if (routine.isEnded)
      throw new BadRequestException('이미 종료된 루틴입니다.');

    await this.prisma.routine.update({
      where: { id: routineId },
      data: { isEnded: true },
    });
  }

  // ─── 루틴 일시정지 / 재개 ────────────────────────────────────────────────────

  async toggleSuspendRoutine(member: Member, routineId: number) {
    const routine = await this.findRoutineOrThrow(member.id, routineId);
    if (routine.isEnded)
      throw new BadRequestException('종료된 루틴은 정지/재개할 수 없습니다.');

    await this.prisma.routine.update({
      where: { id: routineId },
      data: { isSuspended: !routine.isSuspended },
    });

    return { isSuspended: !routine.isSuspended };
  }

  // ─── 루틴 달성 처리 ──────────────────────────────────────────────────────────

  async achieveRoutine(
    member: Member,
    routineId: number,
    dto: AchieveRoutineDto,
  ) {
    const routine = await this.findRoutineOrThrow(member.id, routineId);

    if (routine.isEnded)
      throw new BadRequestException('종료된 루틴은 달성할 수 없습니다.');
    if (routine.isSuspended)
      throw new BadRequestException('일시정지된 루틴은 달성할 수 없습니다.');
    if (routine.isAchieved)
      throw new BadRequestException('오늘 이미 달성한 루틴입니다.');

    await this.prisma.$transaction(async (tx) => {
      // 루틴 달성 상태 업데이트
      await tx.routine.update({
        where: { id: routineId },
        data: {
          isAchieved: true,
          isCompleted: dto.duration >= Number(routine.duration ?? 0),
        },
      });

      // 루틴 로그 기록
      await tx.routineLog.create({
        data: {
          routineId,
          duration: BigInt(dto.duration),
          startTime: dto.startTime ? new Date(dto.startTime) : null,
          endTime: dto.endTime ? new Date(dto.endTime) : null,
          isCompleted: dto.duration >= Number(routine.duration ?? 0),
        },
      });

      // 회원 누적 달성 시간 갱신
      await tx.member.update({
        where: { id: member.id },
        data: { totalAchievedTime: { increment: dto.duration } },
      });
    });

    // 연결된 계좌가 있으면 입금
    if (routine.accountId) {
      await this.accountService.depositToAccount(
        routine.accountId,
        dto.duration,
      );
    }
  }

  // ─── 루틴 로그 조회 ──────────────────────────────────────────────────────────

  async getRoutineLogs(member: Member, routineId: number) {
    await this.findRoutineOrThrow(member.id, routineId);
    const logs = await this.prisma.routineLog.findMany({
      where: { routineId },
      orderBy: { startTime: 'desc' },
    });

    return logs.map((l) => ({
      id: l.id,
      duration: l.duration?.toString(),
      startTime: l.startTime,
      endTime: l.endTime,
      isCompleted: l.isCompleted,
    }));
  }

  // ─── 스케줄러: 매일 자정 - isAchieved / isCompleted 초기화 ──────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyRoutineStatusScheduler() {
    await this.prisma.routine.updateMany({
      where: { isEnded: false, isAchieved: true },
      data: { isAchieved: false, isCompleted: false },
    });
  }

  // ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

  private async findRoutineOrThrow(memberId: number, routineId: number) {
    const routine = await this.prisma.routine.findFirst({
      where: { id: routineId, memberId },
      include: { routineDays: true },
    });
    if (!routine) throw new NotFoundException('루틴을 찾을 수 없습니다.');
    return routine;
  }

  private formatRoutine(routine: any) {
    return {
      id: routine.id,
      title: routine.title,
      startTime: routine.startTime,
      endTime: routine.endTime,
      duration: routine.duration?.toString(),
      linkApp: routine.linkApp,
      accountId: routine.accountId,
      isAchieved: routine.isAchieved,
      isCompleted: routine.isCompleted,
      isSuspended: routine.isSuspended,
      isEnded: routine.isEnded,
      isAiRoutine: routine.isAiRoutine,
      days: routine.routineDays?.map((d: any) => d.day) ?? [],
      createdAt: routine.createdAt,
    };
  }

  // Time 파싱: "HH:mm:ss" → Date (날짜는 더미, 시간만 의미 있음 @db.Time(6))
  private parseTime(timeStr: string): Date {
    const [h, m, s] = timeStr.split(':').map(Number);
    const d = new Date(1970, 0, 1, h, m, s ?? 0);
    return d;
  }
}
