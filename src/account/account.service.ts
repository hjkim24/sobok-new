import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Member } from '@prisma/client';
import { MemberService } from '../member/member.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memberService: MemberService,
  ) {}

  // ─── 계좌 생성 ───────────────────────────────────────────────────────────────

  async createAccount(member: Member, dto: CreateAccountDto) {
    const createdAt = new Date();
    let expiredAt: Date | undefined;

    if (dto.duration) {
      expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + dto.duration);
    }

    return this.prisma.account.create({
      data: {
        memberId: member.id,
        title: dto.title,
        duration: dto.duration,
        time: dto.time,
        interest: dto.interest ?? 0,
        balance: 0,
        interestBalance: 0,
        isExpired: false,
        isEnded: false,
        isExtended: false,
        isValid: true,
        createdAt,
        expiredAt,
      },
    });
  }

  // ─── 계좌 목록 조회 ──────────────────────────────────────────────────────────

  async getAccounts(member: Member) {
    const accounts = await this.prisma.account.findMany({
      where: { memberId: member.id },
      include: {
        routines: {
          where: { isEnded: false },
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((a) => this.formatAccount(a));
  }

  // ─── 계좌 단건 조회 ──────────────────────────────────────────────────────────

  async getAccountById(member: Member, accountId: number) {
    const account = await this.findAccountOrThrow(member.id, accountId);
    const routines = await this.prisma.routine.findMany({
      where: { accountId, memberId: member.id, isEnded: false },
      include: { routineDays: true },
    });

    return {
      ...this.formatAccount(account),
      routines: routines.map((r) => ({
        id: r.id,
        title: r.title,
        days: r.routineDays.map((d) => d.day),
        duration: r.duration,
        isAchieved: r.isAchieved,
        isSuspended: r.isSuspended,
      })),
    };
  }

  // ─── 계좌 종료 ───────────────────────────────────────────────────────────────

  async endAccount(member: Member, accountId: number) {
    const account = await this.findAccountOrThrow(member.id, accountId);

    if (account.isEnded)
      throw new BadRequestException('이미 종료된 계좌입니다.');
    if (account.isExpired)
      throw new BadRequestException('이미 만료된 계좌입니다.');

    await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: { isEnded: true, updatedAt: new Date() },
      });

      // 연결된 루틴도 모두 종료
      await tx.routine.updateMany({
        where: { accountId, isEnded: false },
        data: { isEnded: true },
      });
    });
  }

  // ─── 계좌 연장 ───────────────────────────────────────────────────────────────

  async extendAccount(
    member: Member,
    accountId: number,
    extraDays: number = 30,
  ) {
    const account = await this.findAccountOrThrow(member.id, accountId);

    if (account.isEnded)
      throw new BadRequestException('종료된 계좌는 연장할 수 없습니다.');
    if (account.isExpired)
      throw new BadRequestException('만료된 계좌는 연장할 수 없습니다.');

    const baseDate = account.expiredAt ?? new Date();
    const newExpiredAt = new Date(baseDate);
    newExpiredAt.setDate(newExpiredAt.getDate() + extraDays);

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        expiredAt: newExpiredAt,
        isExtended: true,
        updatedAt: new Date(),
      },
    });
  }

  // ─── 계좌 입금 (내부 호출 - RoutineService에서 사용) ──────────────────────────

  async depositToAccount(accountId: number, depositTime: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('계좌를 찾을 수 없습니다.');
    if (account.isExpired || account.isEnded) return; // 종료/만료된 계좌는 입금 무시

    const newBalance = account.balance + depositTime;

    await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: newBalance, updatedAt: new Date() },
      });

      await tx.accountLog.create({
        data: { accountId, depositTime, balance: newBalance },
      });

      // 회원 totalAccountBalance 갱신
      await tx.member.update({
        where: { id: account.memberId },
        data: { totalAccountBalance: { increment: depositTime } },
      });
    });

    // 프리미엄 가격 재계산
    await this.recalculatePremiumPrice(account.memberId);
  }

  // ─── 입금 로그 조회 ──────────────────────────────────────────────────────────

  async getAccountLogs(member: Member, accountId: number) {
    await this.findAccountOrThrow(member.id, accountId);
    const logs = await this.prisma.accountLog.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((l) => ({
      id: l.id,
      depositTime: l.depositTime,
      balance: l.balance,
      createdAt: l.createdAt,
    }));
  }

  // ─── 이자 로그 조회 ──────────────────────────────────────────────────────────

  async getInterestLogs(member: Member, accountId: number) {
    await this.findAccountOrThrow(member.id, accountId);
    const logs = await this.prisma.interestLog.findMany({
      where: { accountId },
      orderBy: { id: 'desc' },
    });
    return logs.map((l) => ({
      id: l.id,
      targetYearMonth: l.targetYearMonth,
      interest: l.interest,
    }));
  }

  // ─── 스케줄러: 매일 자정 - 만료 계좌 처리 ────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireAccountsScheduler() {
    const now = new Date();
    const expiredAccounts = await this.prisma.account.findMany({
      where: {
        isExpired: false,
        isEnded: false,
        expiredAt: { lte: now },
      },
    });

    for (const account of expiredAccounts) {
      await this.prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: { id: account.id },
          data: { isExpired: true, updatedAt: new Date() },
        });

        // 연결된 루틴도 모두 종료
        await tx.routine.updateMany({
          where: { accountId: account.id, isEnded: false },
          data: { isEnded: true },
        });
      });

      // 프리미엄 가격 재계산
      await this.recalculatePremiumPrice(account.memberId);
    }
  }

  // ─── 스케줄러: 매월 1일 - 이자 계산 ──────────────────────────────────────────

  @Cron('0 0 1 * *') // 매월 1일 자정
  async calculateMonthlyInterestScheduler() {
    const now = new Date();
    const targetYearMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`; // 전월

    const activeAccounts = await this.prisma.account.findMany({
      where: { isExpired: false, isEnded: false, interest: { gt: 0 } },
    });

    for (const account of activeAccounts) {
      if (!account.interest || account.balance === 0) continue;

      const monthlyInterest = Math.floor(
        (account.balance * account.interest) / 12,
      );
      if (monthlyInterest <= 0) continue;

      const newInterestBalance =
        BigInt(account.interestBalance) + BigInt(monthlyInterest);

      await this.prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: { id: account.id },
          data: { interestBalance: newInterestBalance },
        });

        await tx.interestLog.create({
          data: {
            accountId: account.id,
            targetYearMonth,
            interest: monthlyInterest,
          },
        });
      });
    }
  }

  // ─── 프리미엄 가격 재계산 (내부) ─────────────────────────────────────────────

  private async recalculatePremiumPrice(memberId: number) {
    const newPrice = await this.memberService.calculatePremiumPrice(memberId);
    await this.prisma.member.update({
      where: { id: memberId },
      data: { premiumPrice: newPrice },
    });
  }

  // ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

  private async findAccountOrThrow(memberId: number, accountId: number) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, memberId },
    });
    if (!account) throw new NotFoundException('계좌를 찾을 수 없습니다.');
    return account;
  }

  private formatAccount(account: any) {
    return {
      id: account.id,
      title: account.title,
      balance: account.balance,
      time: account.time,
      duration: account.duration,
      interest: account.interest,
      interestBalance: account.interestBalance?.toString(),
      isExpired: account.isExpired,
      isEnded: account.isEnded,
      isExtended: account.isExtended,
      isValid: account.isValid,
      createdAt: account.createdAt,
      expiredAt: account.expiredAt,
      routines: account.routines ?? [],
    };
  }
}
