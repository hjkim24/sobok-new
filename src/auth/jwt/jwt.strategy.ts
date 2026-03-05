import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';
import { Member } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      // Authorization header 또는 accessToken 쿠키에서 추출
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.accessToken ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<Member> {
    const { loginType, provider, sub } = payload;

    if (loginType === 'native') {
      const oauthAccount = await this.prisma.oauthAccount.findFirst({
        where: { oauthId: sub, provider },
        include: { member: true },
      });
      if (!oauthAccount)
        throw new UnauthorizedException('OAuth 계정을 찾을 수 없습니다.');
      return oauthAccount.member;
    }

    // 일반 로그인
    const member = await this.prisma.member.findFirst({
      where: { username: sub },
    });
    if (!member) throw new UnauthorizedException('유저를 찾을 수 없습니다.');
    return member;
  }
}
