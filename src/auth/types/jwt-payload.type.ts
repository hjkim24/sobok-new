export type LoginType = 'normal' | 'native';
export type OAuthProvider = 'local' | 'google' | 'apple' | 'kakao';

export interface JwtPayload {
  sub: string; // username (normal) or oauthId (oauth)
  loginType: LoginType;
  provider: OAuthProvider;
  email?: string;
  displayName?: string;
  iat?: number;
  exp?: number;
}
