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
import { RoutineService } from './routine.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { AchieveRoutineDto } from './dto/achieve-routine.dto';

@ApiTags('Routine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('routine')
export class RoutineController {
  constructor(private readonly routineService: RoutineService) {}

  // ─── 루틴 생성 ───────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '루틴 생성' })
  async createRoutine(
    @CurrentMember() member: Member,
    @Body() dto: CreateRoutineDto,
  ) {
    const routine = await this.routineService.createRoutine(member, dto);
    return { id: routine.id, title: routine.title, message: '루틴 생성 성공' };
  }

  // ─── 루틴 목록 조회 ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '루틴 목록 조회 (accountId로 필터 가능)' })
  @ApiQuery({ name: 'accountId', type: Number, required: false })
  async getRoutines(
    @CurrentMember() member: Member,
    @Query('accountId') accountId?: string,
  ) {
    const id = accountId ? parseInt(accountId, 10) : undefined;
    const routines = await this.routineService.getRoutines(member, id);
    return { routines, message: '루틴 목록 조회 성공' };
  }

  // ─── 루틴 단건 조회 ──────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: '루틴 상세 조회' })
  @ApiParam({ name: 'id', type: Number })
  async getRoutineById(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const routine = await this.routineService.getRoutineById(member, id);
    return { routine, message: '루틴 상세 조회 성공' };
  }

  // ─── 루틴 수정 ───────────────────────────────────────────────────────────────

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '루틴 수정' })
  @ApiParam({ name: 'id', type: Number })
  async updateRoutine(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoutineDto,
  ) {
    await this.routineService.updateRoutine(member, id, dto);
    return { message: '루틴 수정 성공' };
  }

  // ─── 루틴 종료 ───────────────────────────────────────────────────────────────

  @Put(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '루틴 종료' })
  @ApiParam({ name: 'id', type: Number })
  async endRoutine(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.routineService.endRoutine(member, id);
    return { message: '루틴 종료 성공' };
  }

  // ─── 루틴 일시정지 / 재개 ────────────────────────────────────────────────────

  @Put(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '루틴 일시정지 / 재개 토글' })
  @ApiParam({ name: 'id', type: Number })
  async toggleSuspendRoutine(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.routineService.toggleSuspendRoutine(member, id);
    return {
      isSuspended: result.isSuspended,
      message: result.isSuspended ? '루틴 일시정지 성공' : '루틴 재개 성공',
    };
  }

  // ─── 루틴 달성 ───────────────────────────────────────────────────────────────

  @Post(':id/achieve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '루틴 달성 처리 (계좌 입금 포함)' })
  @ApiParam({ name: 'id', type: Number })
  async achieveRoutine(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AchieveRoutineDto,
  ) {
    await this.routineService.achieveRoutine(member, id, dto);
    return { message: '루틴 달성 완료' };
  }

  // ─── 루틴 로그 조회 ──────────────────────────────────────────────────────────

  @Get(':id/logs')
  @ApiOperation({ summary: '루틴 달성 로그 조회' })
  @ApiParam({ name: 'id', type: Number })
  async getRoutineLogs(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logs = await this.routineService.getRoutineLogs(member, id);
    return { logs, message: '루틴 로그 조회 성공' };
  }
}
