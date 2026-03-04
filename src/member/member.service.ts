import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Member } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtTokenService } from '../auth/jwt/jwt.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { OauthAdditionalInfoDto } from './dto/oauth-additional-info.dto';

@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  // ─── 회원가입 ────────────────────────────────────────────────────────────────

  async createMember(dto: CreateMemberDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.member.create({
      data: {
        username: dto.username,
        password: hashed,
        name: dto.name,
        displayName: dto.displayName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        birth: dto.birth,
        isOauth: false,
        createdAt: new Date(),
      },
    });
  }

  // ─── 중복 확인 ───────────────────────────────────────────────────────────────

  async isEmailDuplicated(email: string) {
    return (await this.prisma.member.count({ where: { email } })) > 0;
  }

  async isPhoneNumberDuplicated(phoneNumber: string) {
    return (await this.prisma.member.count({ where: { phoneNumber } })) > 0;
  }

  async isUsernameDuplicated(username: string) {
    return (await this.prisma.member.count({ where: { username } })) > 0;
  }

  async isDisplayNameDuplicated(displayName: string) {
    return (await this.prisma.member.count({ where: { displayName } })) > 0;
  }

  // ─── 일반 로그인 ─────────────────────────────────────────────────────────────

  async loginJWT(dto: LoginDto, res: Response) {
    const member = await this.prisma.member.findFirst({
      where: { username: dto.username },
    });
    if (!member || !member.password) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, member.password);
    if (!isMatch) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const accessToken = this.jwtTokenService.createAccessToken(
      member.username!,
      member.displayName ?? undefined,
    );
    const refreshToken = await this.jwtTokenService.createRefreshToken(
      member.id,
      member.username!,
    );

    this.setAccessCookie(res, accessToken);
    this.setRefreshCookie(res, refreshToken);

    return {
      accessToken,
      username: member.username,
      message: '로그인 성공',
      status: 200,
    };
  }

  // ─── 로그아웃 ────────────────────────────────────────────────────────────────

  async logout(refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      await this.jwtTokenService.deleteRefreshToken(refreshToken);
    }
    this.clearCookie(res, 'accessToken');
    this.clearCookie(res, 'refreshToken');
  }

  // ─── 토큰 갱신 ───────────────────────────────────────────────────────────────

  async refreshToken(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token이 존재하지 않습니다.');
    }
    const newAccessToken =
      await this.jwtTokenService.rotateAccessToken(refreshToken);
    this.setAccessCookie(res, newAccessToken);
    return { accessToken: newAccessToken, message: '토큰 갱신 성공' };
  }

  // ─── 유저 정보 조회 ──────────────────────────────────────────────────────────

  async getUserInfo(member: Member) {
    let premiumEndAt: Date | undefined;
    if (member.isPremium) {
      const premium = await this.prisma.premium.findFirst({
        where: { memberId: member.id, endAt: { gt: new Date() } },
      });
      premiumEndAt = premium?.endAt ?? undefined;
    }

    return {
      id: member.id,
      username: member.username ?? '',
      name: member.name ?? '',
      displayName: member.displayName ?? '',
      email: member.email ?? '',
      phoneNumber: member.phoneNumber ?? '',
      birth: member.birth ?? '',
      point: member.point,
      isPremium: member.isPremium,
      premiumEndAt,
      consecutiveAchieveCount: member.consecutiveAchieveCount,
      totalAchievedTime: member.totalAchievedTime,
      totalAccountBalance: member.totalAccountBalance,
      weeklyRoutineTime: member.weeklyRoutineTime,
      message: '유저 정보 조회 성공',
    };
  }

  // ─── 회원 정보 수정 ──────────────────────────────────────────────────────────

  async updateMember(member: Member, dto: UpdateMemberDto) {
    if (dto.phoneNumber) {
      if (await this.isPhoneNumberDuplicated(dto.phoneNumber)) {
        throw new BadRequestException('이미 사용 중인 전화번호입니다.');
      }
    }
    if (dto.email) {
      if (await this.isEmailDuplicated(dto.email)) {
        throw new BadRequestException('이미 사용 중인 이메일입니다.');
      }
    }
    await this.prisma.member.update({
      where: { id: member.id },
      data: {
        ...(dto.phoneNumber && { phoneNumber: dto.phoneNumber }),
        ...(dto.email && { email: dto.email }),
        ...(dto.birth && { birth: dto.birth }),
      },
    });
  }

  // ─── 비밀번호 수정 ───────────────────────────────────────────────────────────

  async updatePassword(member: Member, dto: UpdatePasswordDto) {
    if (!member.password)
      throw new BadRequestException(
        '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.',
      );

    const isMatch = await bcrypt.compare(dto.oldPassword, member.password);
    if (!isMatch)
      throw new BadRequestException(
        '비밀번호 수정 실패: 비밀번호가 일치하지 않습니다.',
      );

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.member.update({
      where: { id: member.id },
      data: { password: hashed },
    });
  }

  // ─── 닉네임 수정 ─────────────────────────────────────────────────────────────

  async updateDisplayName(member: Member, displayName: string) {
    await this.prisma.member.update({
      where: { id: member.id },
      data: { displayName },
    });
  }

  // ─── OAuth 추가 정보 ─────────────────────────────────────────────────────────

  async updateOauthAdditionalInfo(member: Member, dto: OauthAdditionalInfoDto) {
    if (!member.isOauth)
      throw new BadRequestException('OAuth 회원이 아닙니다.');

    if (
      dto.phoneNumber &&
      (await this.isPhoneNumberDuplicated(dto.phoneNumber))
    ) {
      throw new BadRequestException('이미 사용 중인 전화번호입니다.');
    }
    if (
      dto.displayName &&
      (await this.isDisplayNameDuplicated(dto.displayName))
    ) {
      throw new BadRequestException('이미 사용 중인 닉네임입니다.');
    }

    await this.prisma.member.update({
      where: { id: member.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.phoneNumber && { phoneNumber: dto.phoneNumber }),
        ...(dto.birth && { birth: dto.birth }),
      },
    });
  }

  needsAdditionalInfo(member: Member): boolean {
    if (!member.isOauth) return false;
    return (
      !member.name?.trim() ||
      !member.displayName?.trim() ||
      !member.phoneNumber?.trim() ||
      !member.birth?.trim()
    );
  }

  // ─── 프리미엄 ────────────────────────────────────────────────────────────────

  async upgradeToPremium(member: Member) {
    if (member.point < member.premiumPrice) {
      throw new BadRequestException('포인트가 부족합니다.');
    }

    const newBalance = member.point - member.premiumPrice;

    await this.prisma.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: member.id },
        data: { point: newBalance, isPremium: true },
      });

      await tx.pointLog.create({
        data: {
          memberId: member.id,
          point: -member.premiumPrice,
          balance: newBalance,
          category: '구독권 구매',
        },
      });

      const existing = await tx.premium.findFirst({
        where: { memberId: member.id, endAt: { gt: new Date() } },
      });

      const startAt = new Date();
      const endAt = new Date();
      endAt.setMonth(endAt.getMonth() + 1);

      if (existing) {
        await tx.premium.update({
          where: { id: existing.id },
          data: { startAt, endAt },
        });
      } else {
        await tx.premium.create({
          data: { memberId: member.id, startAt, endAt },
        });
      }
    });
  }

  async getPremiumPrice(member: Member) {
    return { price: member.premiumPrice, message: '구독권 가격 조회 성공' };
  }

  async getPremiumLog(member: Member) {
    const premiums = await this.prisma.premium.findMany({
      where: { memberId: member.id },
    });
    return premiums.map((p) => ({ startAt: p.startAt, endAt: p.endAt }));
  }

  // ─── 연동 앱 ─────────────────────────────────────────────────────────────────

  async updateLinkApps(member: Member, linkApps: string[]) {
    await this.prisma.$transaction([
      this.prisma.memberLinkApp.deleteMany({ where: { memberId: member.id } }),
      ...linkApps.map((linkApp) =>
        this.prisma.memberLinkApp.create({
          data: { memberId: member.id, linkApp },
        }),
      ),
    ]);
  }

  async getLinkApps(member: Member) {
    const rows = await this.prisma.memberLinkApp.findMany({
      where: { memberId: member.id },
    });
    return {
      linkApps: rows.map((r) => r.linkApp),
      message: '연동 앱 조회 성공',
    };
  }

  // linkApp으로 연결된 루틴 목록 조회 (구 getTodosByLinkApp → 기획 변경으로 Routine 기반)
  async getRoutinesByLinkApp(member: Member, linkApp: string) {
    const routines = await this.prisma.routine.findMany({
      where: { memberId: member.id, linkApp, isEnded: false },
      include: { routineDays: true },
    });
    return routines.map((r) => ({
      id: r.id,
      title: r.title,
      linkApp: r.linkApp,
      startTime: r.startTime,
      endTime: r.endTime,
      duration: r.duration,
      days: r.routineDays.map((d) => d.day),
    }));
  }

  // 프리미엄 가격 계산 (적금 총 시간 기반, AccountModule에서 호출)
  async calculatePremiumPrice(memberId: number): Promise<number> {
    const accounts = await this.prisma.account.findMany({
      where: { memberId, isExpired: false },
      select: { time: true },
    });
    if (!accounts.length) return 9999;
    const total = accounts.reduce((sum, a) => sum + (a.time ?? 0), 0);
    return Math.round(total * 0.9);
  }

  // ─── 쿠키 헬퍼 ───────────────────────────────────────────────────────────────

  private setAccessCookie(res: Response, token: string) {
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: true,
      path: '/',
      maxAge: 15 * 60 * 1000, // 15분
    });
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });
  }

  private clearCookie(res: Response, name: string) {
    res.cookie(name, '', { httpOnly: true, path: '/', maxAge: 0 });
  }
}
