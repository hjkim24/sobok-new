import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Member } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentMember } from '../common/decorators/current-member.decorator';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';

@ApiTags('Account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // ─── 계좌 생성 ───────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '적금 계좌 생성' })
  async createAccount(
    @CurrentMember() member: Member,
    @Body() dto: CreateAccountDto,
  ) {
    const account = await this.accountService.createAccount(member, dto);
    return { id: account.id, title: account.title, message: '계좌 생성 성공' };
  }

  // ─── 계좌 목록 조회 ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '적금 계좌 목록 조회' })
  async getAccounts(@CurrentMember() member: Member) {
    const accounts = await this.accountService.getAccounts(member);
    return { accounts, message: '계좌 목록 조회 성공' };
  }

  // ─── 계좌 단건 조회 ──────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: '적금 계좌 상세 조회' })
  @ApiParam({ name: 'id', type: Number })
  async getAccountById(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const account = await this.accountService.getAccountById(member, id);
    return { account, message: '계좌 상세 조회 성공' };
  }

  // ─── 계좌 종료 ───────────────────────────────────────────────────────────────

  @Put(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '적금 계좌 수동 종료' })
  @ApiParam({ name: 'id', type: Number })
  async endAccount(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.accountService.endAccount(member, id);
    return { message: '계좌 종료 성공' };
  }

  // ─── 계좌 연장 ───────────────────────────────────────────────────────────────

  @Put(':id/extend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '적금 계좌 기간 연장 (기본 30일)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'days', type: Number, required: false })
  async extendAccount(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
    @Query('days') days?: string,
  ) {
    const extraDays = days ? parseInt(days, 10) : 30;
    await this.accountService.extendAccount(member, id, extraDays);
    return { message: '계좌 연장 성공' };
  }

  // ─── 입금 로그 조회 ──────────────────────────────────────────────────────────

  @Get(':id/logs')
  @ApiOperation({ summary: '계좌 입금 로그 조회' })
  @ApiParam({ name: 'id', type: Number })
  async getAccountLogs(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logs = await this.accountService.getAccountLogs(member, id);
    return { logs, message: '입금 로그 조회 성공' };
  }

  // ─── 이자 로그 조회 ──────────────────────────────────────────────────────────

  @Get(':id/interest-logs')
  @ApiOperation({ summary: '계좌 이자 로그 조회' })
  @ApiParam({ name: 'id', type: Number })
  async getInterestLogs(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logs = await this.accountService.getInterestLogs(member, id);
    return { logs, message: '이자 로그 조회 성공' };
  }
}
