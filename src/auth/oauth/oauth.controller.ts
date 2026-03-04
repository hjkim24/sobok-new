import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtTokenService } from '../jwt/jwt.service';
import { GoogleTokenVerifier } from './google.service';
import { KakaoTokenVerifier } from './kakao.service';
import { AppleTokenVerifier } from './apple.service';

class GoogleLoginDto {
  @IsString()
  idToken: string;
}

class KakaoLoginDto {
  @IsString()
  accessToken: string;
}

class AppleLoginDto {
  @IsString()
  identityToken: string;
}

@ApiTags('OAuth')
@Controller('api/auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly googleVerifier: GoogleTokenVerifier,
    private readonly kakaoVerifier: KakaoTokenVerifier,
    private readonly appleVerifier: AppleTokenVerifier,
  ) {}

  @Post('google/native')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '구글 네이티브 로그인' })
  async googleNativeLogin(@Body() body: GoogleLoginDto) {
    this.logger.log('구글 네이티브 로그인 요청 수신');

    const userInfo = await this.googleVerifier.verifyIdToken(body.idToken);

    if (!userInfo.email?.trim()) {
      throw new BadRequestException('이메일 정보가 필요합니다.');
    }

    const { member, isExistingUser } = await this.findOrCreateOAuthMember(
      userInfo.sub,
      'google',
      userInfo.email,
    );

    const accessToken = this.jwtTokenService.createOAuthAccessToken(
      userInfo.sub,
      'google',
      userInfo.email,
    );
    const refreshToken = await this.jwtTokenService.createOAuthRefreshToken(
      member.id,
      userInfo.sub,
      'google',
      userInfo.email,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: member.id,
        email: member.email ?? '',
        provider: 'google',
        isExistingUser,
      },
    };
  }

  @Post('kakao/native')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '카카오 네이티브 로그인' })
  async kakaoNativeLogin(@Body() body: KakaoLoginDto) {
    this.logger.log('카카오 네이티브 로그인 요청 수신');

    const userInfo = await this.kakaoVerifier.verifyAccessToken(
      body.accessToken,
    );

    if (!userInfo.email?.trim()) {
      throw new BadRequestException('이메일 정보가 필요합니다.');
    }

    const { member, isExistingUser } = await this.findOrCreateOAuthMember(
      userInfo.id,
      'kakao',
      userInfo.email,
    );

    const accessToken = this.jwtTokenService.createOAuthAccessToken(
      userInfo.id,
      'kakao',
      userInfo.email,
    );
    const refreshToken = await this.jwtTokenService.createOAuthRefreshToken(
      member.id,
      userInfo.id,
      'kakao',
      userInfo.email,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: member.id,
        email: member.email,
        provider: 'kakao',
        isExistingUser,
      },
    };
  }

  @Post('apple/native')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apple 네이티브 로그인' })
  async appleNativeLogin(@Body() body: AppleLoginDto) {
    this.logger.log('Apple 네이티브 로그인 요청 수신');

    const userInfo = await this.appleVerifier.verifyIdentityToken(
      body.identityToken,
    );

    if (!userInfo.email?.trim()) {
      throw new BadRequestException('이메일 정보가 필요합니다.');
    }

    const { member, isExistingUser } = await this.findOrCreateOAuthMember(
      userInfo.sub,
      'apple',
      userInfo.email,
    );

    const accessToken = this.jwtTokenService.createOAuthAccessToken(
      userInfo.sub,
      'apple',
      userInfo.email,
    );
    const refreshToken = await this.jwtTokenService.createOAuthRefreshToken(
      member.id,
      userInfo.sub,
      'apple',
      userInfo.email,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: member.id,
        email: member.email ?? '',
        provider: 'apple',
        isExistingUser,
      },
    };
  }

  /** 기존 OAuth 계정 조회 또는 신규 회원 + OAuthAccount 생성 */
  private async findOrCreateOAuthMember(
    oauthId: string,
    provider: string,
    email: string,
  ) {
    // 1. 기존 OAuth 계정이 있으면 그 회원 반환
    const existing = await this.prisma.oauthAccount.findFirst({
      where: { oauthId, provider },
      include: { member: true },
    });
    if (existing) {
      return { member: existing.member, isExistingUser: true };
    }

    // 2. 같은 이메일로 가입된 회원 찾기
    const isPrivateRelay = email.endsWith('@privaterelay.appleid.com');
    let existingMember = isPrivateRelay
      ? null
      : await this.prisma.member.findFirst({ where: { email } });

    if (existingMember) {
      // 이미 다른 동일 provider 계정이 연결돼 있으면 에러
      const duplicateProvider = await this.prisma.oauthAccount.findFirst({
        where: { memberId: existingMember.id, provider },
      });
      if (duplicateProvider) {
        throw new BadRequestException(
          `이미 다른 ${provider} 계정이 연결되어 있습니다.`,
        );
      }
    } else {
      // 3. 신규 회원 생성
      existingMember = await this.prisma.member.create({
        data: {
          email,
          username: oauthId,
          isOauth: true,
          createdAt: new Date(),
        },
      });
    }

    // 4. OauthAccount 연결
    await this.prisma.oauthAccount.create({
      data: {
        oauthId,
        provider,
        memberId: existingMember.id,
        createdAt: new Date(),
      },
    });

    return { member: existingMember, isExistingUser: false };
  }
}
