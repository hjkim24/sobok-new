import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface AppleUserInfo {
  sub: string;
  email: string;
  emailVerified: boolean;
}

@Injectable()
export class AppleTokenVerifier {
  private readonly logger = new Logger(AppleTokenVerifier.name);
  private readonly appleClientId: string;
  private static readonly APPLE_JWKS = createRemoteJWKSet(
    new URL('https://appleid.apple.com/auth/keys'),
  );

  constructor(config: ConfigService) {
    this.appleClientId = config.get<string>('APPLE_CLIENT_ID', '');
  }

  async verifyIdentityToken(identityToken: string): Promise<AppleUserInfo> {
    const { payload } = await jwtVerify(
      identityToken,
      AppleTokenVerifier.APPLE_JWKS,
      {
        issuer: 'https://appleid.apple.com',
        audience: this.appleClientId,
      },
    );

    const sub = payload.sub as string;
    const email = payload.email as string;
    const emailVerified = Boolean(payload.email_verified ?? false);

    this.logger.log(`Apple 사용자 정보 조회 성공: sub=${sub}`);
    return { sub, email, emailVerified };
  }
}
