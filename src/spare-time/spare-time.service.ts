import { Injectable, NotFoundException } from '@nestjs/common';
import type { Member } from '@prisma/client';
import { DayOfWeek } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpareTimeDto, UpdateSpareTimeDto } from './dto/spare-time.dto';

@Injectable()
export class SpareTimeService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 요일별 자투리 시간 조회 ──────────────────────────────────────────────────

  async getSpareTimeByDay(member: Member, day: DayOfWeek) {
    const spareTimeList = await this.prisma.spareTime.findMany({
      where: {
        memberId: member.id,
        spareTimeDays: { some: { day } },
      },
      include: { spareTimeDays: true },
    });

    const result = spareTimeList.map((st) => this.formatSpareTime(st));
    const totalDuration = result.reduce(
      (sum, st) => sum + (Number(st.duration) || 0),
      0,
    );

    return { duration: totalDuration, spareTimeList: result };
  }

  // ─── 요일별 총 자투리 시간 통계 ───────────────────────────────────────────────

  async getSpareTimeDuration(member: Member) {
    const days: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const result: Record<string, number> = {};

    for (const day of days) {
      const spareTimes = await this.prisma.spareTime.findMany({
        where: {
          memberId: member.id,
          spareTimeDays: { some: { day } },
        },
      });
      result[day.toLowerCase()] = spareTimes.reduce(
        (sum, st) => sum + (Number(st.duration) || 0),
        0,
      );
    }

    return result;
  }

  // ─── 자투리 시간 등록 ─────────────────────────────────────────────────────────

  async save(member: Member, dto: CreateSpareTimeDto) {
    const duration = this.calcDurationMinutes(dto.startTime, dto.endTime);

    await this.prisma.$transaction(async (tx) => {
      const spareTime = await tx.spareTime.create({
        data: {
          memberId: member.id,
          title: dto.title,
          startTime: dto.startTime,
          endTime: dto.endTime,
          duration,
        },
      });

      await tx.spareTimeDay.createMany({
        data: dto.days.map((day) => ({ spareTimeId: spareTime.id, day })),
      });
    });
  }

  // ─── 자투리 시간 수정 ─────────────────────────────────────────────────────────

  async update(member: Member, dto: UpdateSpareTimeDto) {
    const existing = await this.prisma.spareTime.findFirst({
      where: { id: dto.id, memberId: member.id },
    });
    if (!existing)
      throw new NotFoundException('자투리 시간 설정을 찾을 수 없습니다.');

    const duration = this.calcDurationMinutes(dto.startTime, dto.endTime);

    await this.prisma.$transaction(async (tx) => {
      await tx.spareTime.update({
        where: { id: dto.id },
        data: {
          title: dto.title,
          startTime: dto.startTime,
          endTime: dto.endTime,
          duration,
        },
      });

      await tx.spareTimeDay.deleteMany({ where: { spareTimeId: dto.id } });
      await tx.spareTimeDay.createMany({
        data: dto.days.map((day) => ({ spareTimeId: dto.id, day })),
      });
    });
  }

  // ─── 자투리 시간 삭제 ─────────────────────────────────────────────────────────

  async delete(member: Member, spareTimeId: number) {
    const existing = await this.prisma.spareTime.findFirst({
      where: { id: spareTimeId, memberId: member.id },
    });
    if (!existing)
      throw new NotFoundException('자투리 시간 설정을 찾을 수 없습니다.');

    await this.prisma.spareTime.delete({ where: { id: spareTimeId } });
  }

  // ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

  private calcDurationMinutes(startTime: string, endTime: string): bigint {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const diff = end >= start ? end - start : 24 * 60 - start + end;
    return BigInt(diff);
  }

  private formatSpareTime(st: any) {
    return {
      id: st.id,
      title: st.title,
      startTime: st.startTime,
      endTime: st.endTime,
      duration: st.duration?.toString(),
      days: st.spareTimeDays?.map((d: any) => d.day) ?? [],
    };
  }
}
