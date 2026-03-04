import { Injectable, Logger } from '@nestjs/common';

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleTokenVerifier {
  private readonly logger = new Logger(GoogleTokenVerifier.name);
  private static readonly TOKEN_INFO_URL =
    'https://oauth2.googleapis.com/tokeninfo?id_token=';

  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const url = `${GoogleTokenVerifier.TOKEN_INFO_URL}${idToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`구글 ID Token 검증 실패: ${response.status}`);
    }

    const data: Record<string, string> = await response.json();

    if (data.error) {
      throw new Error(
        `구글 ID Token이 유효하지 않습니다: ${data.error_description}`,
      );
    }

    this.logger.log(
      `구글 사용자 정보 조회 성공: sub=${data.sub}, email=${data.email}`,
    );

    return {
      sub: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }
}
