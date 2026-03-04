import { Injectable, Logger } from '@nestjs/common';

export interface KakaoUserInfo {
  id: string;
  email?: string;
  nickname?: string;
}

@Injectable()
export class KakaoTokenVerifier {
  private readonly logger = new Logger(KakaoTokenVerifier.name);
  private static readonly USER_INFO_URL = 'https://kapi.kakao.com/v2/user/me';

  async verifyAccessToken(accessToken: string): Promise<KakaoUserInfo> {
    const response = await fetch(KakaoTokenVerifier.USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`카카오 사용자 정보 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    const kakaoAccount = data.kakao_account ?? {};

    const userInfo: KakaoUserInfo = {
      id: String(data.id),
      email: kakaoAccount.email,
    };

    this.logger.log(
      `카카오 사용자 정보 조회 성공: id=${userInfo.id}, email=${userInfo.email}`,
    );
    return userInfo;
  }
}
