# Sobok API

루틴 관리와 시간 저축을 통해 생산성을 향상시키는 앱의 백엔드 서버입니다.

## 주요 기능

- **루틴 관리** — 루틴 생성, 반복 요일 설정, 일일 달성 추적
- **적금 시스템** — 시간을 적금처럼 저축하고 이자를 받는 게임화 기능
- **포인트 시스템** — 루틴 달성 시 포인트 적립 및 리워드
- **통계 및 리포트** — 월별 사용자 리포트, 스노우 카드
- **AI 루틴 추천** — OpenAI 기반 맞춤 루틴 추천
- **소셜 로그인** — Google, Kakao, Apple OAuth
- **SMS 인증** — CoolSMS 기반 휴대폰 번호 인증
- **FCM 푸시 알림** — Firebase 기반 알림

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | NestJS 11, TypeScript 5 |
| 데이터베이스 | PostgreSQL (Supabase), Prisma ORM |
| 캐시 | Redis 7 |
| 인증 | JWT, Passport, OAuth2 |
| 인프라 | Oracle Cloud (OCI), Terraform, GitHub Actions |
| 외부 서비스 | Firebase FCM, OpenAI, CoolSMS |
| 로그 | Vector + BetterStack |

## 시작하기

### 사전 요구사항

- Node.js 22+
- pnpm 10+
- Docker (로컬 DB/Redis용)

### 로컬 개발 환경 설정

```bash
# 의존성 설치
pnpm install

# DB & Redis 실행
pnpm db:up

# Prisma 클라이언트 생성
pnpm prisma:generate

# DB 마이그레이션
pnpm prisma:migrate

# 개발 서버 실행 (http://localhost:3000)
pnpm start:dev
```

### API 문서

개발 서버 실행 후 Swagger UI에서 확인할 수 있습니다:

```
http://localhost:3000/api/docs
```

## 환경 변수

`.env` 파일을 프로젝트 루트에 생성하세요:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/sobok
DIRECT_URL=postgresql://user:password@host:5432/sobok

# JWT
JWT_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRY=86400
JWT_REFRESH_EXPIRY=2592000

# OAuth
APPLE_CLIENT_ID=com.your.app

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CoolSMS
COOLSMS_API_KEY=
COOLSMS_API_SECRET=
COOLSMS_FROM_NUMBER=

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=secrets/firebase-admin-sdk.json

# OpenAI
OPENAI_API_KEY=
```

Firebase 서비스 계정 JSON 파일은 `secrets/firebase-admin-sdk.json`에 위치해야 합니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 자동으로 OCI 서버에 배포합니다.

수동 배포가 필요한 경우 GitHub Actions의 `workflow_dispatch`로 트리거할 수 있습니다.

### 필요한 GitHub Secrets

| Secret | 설명 |
|--------|------|
| `TF_API_TOKEN` | Terraform Cloud 토큰 |
| `SSH_PRIVATE_KEY` | 서버 SSH 개인 키 |
| `ENV_PRODUCTION` | 프로덕션 `.env` 파일 내용 |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase 서비스 계정 JSON |

### 인프라 관리

서버 인프라는 Terraform으로 관리됩니다:

```bash
cd infra
terraform init
terraform plan
terraform apply
```

## 프로젝트 구조

```
src/
├── account/        # 적금 계좌 관리
├── auth/           # 인증 (JWT, OAuth)
├── category/       # 카테고리
├── member/         # 사용자 프로필, 포인트
├── notification/   # FCM 푸시 알림
├── routine/        # 루틴 CRUD 및 추적
├── spare-time/     # 여유 시간 관리
├── statistics/     # 리포트, 스노우 카드
├── survey/         # 설문 및 AI 추천
├── sms/            # SMS 인증
├── prisma/         # DB 서비스
└── common/         # 공통 유틸리티
```
