import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtTokenService } from './jwt/jwt.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleTokenVerifier } from './oauth/google.service';
import { KakaoTokenVerifier } from './oauth/kakao.service';
import { AppleTokenVerifier } from './oauth/apple.service';
import { OAuthController } from './oauth/oauth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<number>('JWT_ACCESS_EXPIRY', 86400),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OAuthController],
  providers: [
    JwtTokenService,
    JwtStrategy,
    JwtAuthGuard,
    GoogleTokenVerifier,
    KakaoTokenVerifier,
    AppleTokenVerifier,
  ],
  exports: [JwtTokenService, JwtAuthGuard],
})
export class AuthModule {}
