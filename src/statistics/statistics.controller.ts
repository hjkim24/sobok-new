import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Member } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentMember } from '../common/decorators/current-member.decorator';
import { StatisticsService } from './statistics.service';
import { ReportService } from './report/report.service';
import { SnowCardService } from './snowcard/snowcard.service';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly reportService: ReportService,
    private readonly snowCardService: SnowCardService,
  ) {}

  @Get('date')
  @ApiOperation({ summary: '기간별 일일 달성도' })
  @ApiQuery({ name: 'startDate', type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', type: String, example: '2025-01-31' })
  async getDailyAchieve(
    @CurrentMember() member: Member,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getDailyAchieve(member, startDate, endDate);
  }

  @Get('routine')
  @ApiOperation({ summary: '루틴별 기간 달성도' })
  @ApiQuery({ name: 'routineId', type: Number })
  @ApiQuery({ name: 'startDate', type: String })
  @ApiQuery({ name: 'endDate', type: String })
  async getDailyRoutineAchieve(
    @Query('routineId') routineId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getDailyRoutineAchieve(
      parseInt(routineId, 10),
      startDate,
      endDate,
    );
  }

  @Get('date/log')
  @ApiOperation({ summary: '날짜별 달성 로그 (완료된 루틴 목록)' })
  @ApiQuery({ name: 'date', type: String, example: '2025-01-15' })
  async getDailyAchieveLog(
    @CurrentMember() member: Member,
    @Query('date') date: string,
  ) {
    return this.statisticsService.getDailyAchieveLog(member, date);
  }

  @Get('routine/log')
  @ApiOperation({ summary: '루틴별 날짜 달성 로그' })
  @ApiQuery({ name: 'routineId', type: Number })
  @ApiQuery({ name: 'date', type: String })
  async getDailyRoutineAchieveLog(
    @Query('routineId') routineId: string,
    @Query('date') date: string,
  ) {
    return this.statisticsService.getDailyRoutineAchieveLog(
      parseInt(routineId, 10),
      date,
    );
  }

  @Get('date/count')
  @ApiOperation({ summary: '기간별 누적 시간 + 달성일 수' })
  @ApiQuery({ name: 'startDate', type: String })
  @ApiQuery({ name: 'endDate', type: String })
  async getDateTimeStatistics(
    @CurrentMember() member: Member,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getDateTimeStatistics(
      member,
      startDate,
      endDate,
    );
  }

  @Get('routine/count')
  @ApiOperation({ summary: '루틴별 이번 주 통계' })
  @ApiQuery({ name: 'routineId', type: Number })
  async getRoutineTimeStatistics(@Query('routineId') routineId: string) {
    return this.statisticsService.getRoutineTimeStatistics(
      parseInt(routineId, 10),
    );
  }
}

// ─── Report + SnowCard 컨트롤러 ──────────────────────────────────────────────

import { Controller as Ctrl, Get as G, Query as Q } from '@nestjs/common';

@ApiTags('Report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Ctrl('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @G()
  @ApiOperation({ summary: '월간 리포트' })
  @ApiQuery({ name: 'yearMonth', type: String, example: '2025-01' })
  async getReport(
    @CurrentMember() member: Member,
    @Q('yearMonth') yearMonth: string,
  ) {
    return this.reportService.getReport(member, yearMonth);
  }
}

@ApiTags('SnowCard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Ctrl('snowcard')
export class SnowCardController {
  constructor(private readonly snowCardService: SnowCardService) {}

  @G()
  @ApiOperation({ summary: '월별 눈 카드 조회/생성' })
  @ApiQuery({ name: 'yearMonth', type: String, example: '2025-01' })
  async getSnowCard(
    @CurrentMember() member: Member,
    @Q('yearMonth') yearMonth: string,
  ) {
    return this.snowCardService.getSnowCard(member, yearMonth);
  }

  @G('all')
  @ApiOperation({ summary: '전체 눈 카드 목록 조회' })
  async getAllSnowCards(@CurrentMember() member: Member) {
    return this.snowCardService.getAllSnowCards(member);
  }
}
