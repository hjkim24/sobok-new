import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, OAuthProvider } from '../types/jwt-payload.type';

@Injectable()
export class JwtTokenService {
  private readonly accessExpiry: number;
  private readonly refreshExpiry: number;

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.accessExpiry = this.config.get<number>('JWT_ACCESS_EXPIRY', 86400);
    this.refreshExpiry = this.config.get<number>('JWT_REFRESH_EXPIRY', 2592000);
  }

  // 일반 로그인용 액세스 토큰
  createAccessToken(username: string, displayName?: string): string {
    const payload: JwtPayload = {
      sub: username,
      loginType: 'normal',
      provider: 'local',
      displayName,
    };
    return this.jwtService.sign(payload, { expiresIn: this.accessExpiry });
  }

  // 일반 로그인용 리프레시 토큰 (DB 저장)
  async createRefreshToken(
    memberId: number,
    username: string,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: username,
      loginType: 'normal',
      provider: 'local',
    };
    const token = this.jwtService.sign(payload, {
      expiresIn: this.refreshExpiry,
    });
    const expiredAt = new Date(Date.now() + this.refreshExpiry * 1000);
    await this.prisma.refreshToken.create({
      data: { refreshToken: token, username, expiredAt, memberId },
    });
    return token;
  }

  // OAuth 로그인용 액세스 토큰
  createOAuthAccessToken(
    oauthId: string,
    provider: OAuthProvider,
    email?: string,
  ): string {
    const payload: JwtPayload = {
      sub: oauthId,
      loginType: 'native',
      provider,
      email,
    };
    return this.jwtService.sign(payload, { expiresIn: this.accessExpiry });
  }

  // OAuth 로그인용 리프레시 토큰 (DB 저장)
  async createOAuthRefreshToken(
    memberId: number,
    oauthId: string,
    provider: OAuthProvider,
    email?: string,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: oauthId,
      loginType: 'native',
      provider,
      email,
    };
    const token = this.jwtService.sign(payload, {
      expiresIn: this.refreshExpiry,
    });
    const expiredAt = new Date(Date.now() + this.refreshExpiry * 1000);
    await this.prisma.refreshToken.create({
      data: { refreshToken: token, username: oauthId, expiredAt, memberId },
    });
    return token;
  }

  // 리프레시 토큰으로 새 액세스 토큰 발급
  async rotateAccessToken(refreshToken: string): Promise<string> {
    const payload = this.jwtService.verify<JwtPayload>(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { refreshToken, expiredAt: { gt: new Date() } },
    });
    if (!stored) throw new Error('유효하지 않은 리프레시 토큰입니다.');

    if (payload.loginType === 'native') {
      return this.createOAuthAccessToken(
        payload.sub,
        payload.provider,
        payload.email,
      );
    }
    return this.createAccessToken(payload.sub, payload.displayName);
  }

  // 로그아웃 - 리프레시 토큰 삭제
  async deleteRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { refreshToken } });
  }

  // 만료된 리프레시 토큰 정리 (스케줄러용)
  async cleanExpiredRefreshTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { expiredAt: { lt: new Date() } },
    });
  }

  verify(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
