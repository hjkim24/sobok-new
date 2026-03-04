import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { Member } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentMember } from '../common/decorators/current-member.decorator';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { OauthAdditionalInfoDto } from './dto/oauth-additional-info.dto';

@ApiTags('Member')
@Controller('user')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // ─── 회원가입 / 중복 확인 ─────────────────────────────────────────────────────

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '회원가입' })
  async createMember(@Body() dto: CreateMemberDto) {
    const member = await this.memberService.createMember(dto);
    return {
      id: member.id,
      username: member.username,
      email: member.email,
      message: '회원가입 완료',
    };
  }

  @Get('is-duplicated/email')
  @ApiOperation({ summary: '이메일 중복 확인' })
  @ApiQuery({ name: 'email', type: String })
  async isEmailDuplicated(@Query('email') email: string) {
    return { isDuplicated: await this.memberService.isEmailDuplicated(email) };
  }

  @Get('is-duplicated/phone-number')
  @ApiOperation({ summary: '전화번호 중복 확인' })
  @ApiQuery({ name: 'phoneNumber', type: String })
  async isPhoneNumberDuplicated(@Query('phoneNumber') phoneNumber: string) {
    return {
      isDuplicated:
        await this.memberService.isPhoneNumberDuplicated(phoneNumber),
    };
  }

  @Get('is-duplicated/username')
  @ApiOperation({ summary: '아이디 중복 확인' })
  @ApiQuery({ name: 'username', type: String })
  async isUsernameDuplicated(@Query('username') username: string) {
    return {
      isDuplicated: await this.memberService.isUsernameDuplicated(username),
    };
  }

  @Get('is-duplicated/display-name')
  @ApiOperation({ summary: '닉네임 중복 확인' })
  @ApiQuery({ name: 'displayName', type: String })
  async isDisplayNameDuplicated(@Query('displayName') displayName: string) {
    return {
      isDuplicated:
        await this.memberService.isDisplayNameDuplicated(displayName),
    };
  }

  // ─── 로그인 / 로그아웃 / 토큰 갱신 ──────────────────────────────────────────

  @Post('login/jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '일반 로그인 (JWT)' })
  async loginJWT(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.memberService.loginJWT(dto, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.memberService.logout(req.cookies?.refreshToken, res);
    return { message: '로그아웃 성공' };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '액세스 토큰 갱신' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.memberService.refreshToken(req.cookies?.refreshToken, res);
  }

  // ─── 인증 필요 엔드포인트 ─────────────────────────────────────────────────────

  @Get('info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저 정보 조회' })
  async getInfo(@CurrentMember() member: Member) {
    return this.memberService.getUserInfo(member);
  }

  @Put('update/general')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '회원 정보 수정 (이메일/전화번호/생년월일)' })
  async updateMember(
    @CurrentMember() member: Member,
    @Body() dto: UpdateMemberDto,
  ) {
    await this.memberService.updateMember(member, dto);
    return { message: '회원 정보 수정 성공' };
  }

  @Put('update/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '비밀번호 수정' })
  async updatePassword(
    @CurrentMember() member: Member,
    @Body() dto: UpdatePasswordDto,
  ) {
    await this.memberService.updatePassword(member, dto);
    return { message: '비밀번호 수정 성공' };
  }

  @Put('update/display-name')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '닉네임 수정' })
  @ApiQuery({ name: 'displayName', type: String })
  async updateDisplayName(
    @CurrentMember() member: Member,
    @Query('displayName') displayName: string,
  ) {
    await this.memberService.updateDisplayName(member, displayName);
    return { message: '닉네임 수정 성공' };
  }

  // ─── OAuth 추가 정보 ─────────────────────────────────────────────────────────

  @Put('oauth/additional-info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'OAuth 회원 추가 정보 입력' })
  async updateOauthAdditionalInfo(
    @CurrentMember() member: Member,
    @Body() dto: OauthAdditionalInfoDto,
  ) {
    await this.memberService.updateOauthAdditionalInfo(member, dto);
    return {
      message: '추가 정보 입력 완료',
      needsAdditionalInfo: this.memberService.needsAdditionalInfo(member),
    };
  }

  @Get('oauth/needs-additional-info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'OAuth 회원 추가 정보 필요 여부 확인' })
  async checkOauthNeedsAdditionalInfo(@CurrentMember() member: Member) {
    return {
      needsAdditionalInfo: this.memberService.needsAdditionalInfo(member),
      currentInfo: {
        name: member.name ?? '',
        displayName: member.displayName ?? '',
        phoneNumber: member.phoneNumber ?? '',
        birth: member.birth ?? '',
      },
    };
  }

  // ─── 프리미엄 ────────────────────────────────────────────────────────────────

  @Put('premium')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프리미엄 구독 (포인트 차감)' })
  async upgradeToPremium(@CurrentMember() member: Member) {
    await this.memberService.upgradeToPremium(member);
    return { message: '구독권 등록 성공' };
  }

  @Get('premium')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프리미엄 가격 조회' })
  async getPremiumPrice(@CurrentMember() member: Member) {
    return this.memberService.getPremiumPrice(member);
  }

  @Get('premium/log')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프리미엄 구독 이력 조회' })
  async getPremiumLog(@CurrentMember() member: Member) {
    const premiumLog = await this.memberService.getPremiumLog(member);
    return { premiumLog, message: '프리미엄 로그 조회 성공' };
  }

  @Get('achieve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '연속 달성일 조회' })
  async getAchieveCount(@CurrentMember() member: Member) {
    return {
      achieveCount: member.consecutiveAchieveCount,
      message: '연속 달성일 조회 성공',
    };
  }

  // ─── 연동 앱 ─────────────────────────────────────────────────────────────────

  @Post('link-app')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '연동 앱 등록' })
  async updateLinkApps(
    @CurrentMember() member: Member,
    @Body() body: { linkApps: string[] },
  ) {
    await this.memberService.updateLinkApps(member, body.linkApps);
    return { message: '연동 앱 등록 성공' };
  }

  @Get('link-app')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '연동 앱 목록 조회' })
  async getLinkApps(@CurrentMember() member: Member) {
    return this.memberService.getLinkApps(member);
  }

  @Get('link-app/routines')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '연동 앱의 루틴 목록 조회' })
  @ApiQuery({ name: 'linkApp', type: String })
  async getLinkAppRoutines(
    @CurrentMember() member: Member,
    @Query('linkApp') linkApp: string,
  ) {
    const routines = await this.memberService.getRoutinesByLinkApp(
      member,
      linkApp,
    );
    return { routines };
  }
}
