import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
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
import type { Member } from '@prisma/client';
import { DayOfWeek } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentMember } from '../common/decorators/current-member.decorator';
import { SpareTimeService } from './spare-time.service';
import { CreateSpareTimeDto, UpdateSpareTimeDto } from './dto/spare-time.dto';

@ApiTags('SpareTime')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('spare-time')
export class SpareTimeController {
  constructor(private readonly spareTimeService: SpareTimeService) {}

  @Get('by-day')
  @ApiOperation({ summary: '요일별 자투리 시간 조회' })
  @ApiQuery({ name: 'day', enum: DayOfWeek })
  async getSpareTimeByDay(
    @CurrentMember() member: Member,
    @Query('day') day: DayOfWeek,
  ) {
    return this.spareTimeService.getSpareTimeByDay(member, day);
  }

  @Get('duration')
  @ApiOperation({ summary: '요일별 자투리 시간 통계' })
  async getSpareTimeDuration(@CurrentMember() member: Member) {
    return this.spareTimeService.getSpareTimeDuration(member);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '자투리 시간 등록' })
  async saveSpareTime(
    @CurrentMember() member: Member,
    @Body() dto: CreateSpareTimeDto,
  ) {
    await this.spareTimeService.save(member, dto);
    return { message: '자투리 시간 등록 성공' };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '자투리 시간 수정' })
  async updateSpareTime(
    @CurrentMember() member: Member,
    @Body() dto: UpdateSpareTimeDto,
  ) {
    await this.spareTimeService.update(member, dto);
    return { message: '자투리 시간 수정 성공' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '자투리 시간 삭제' })
  @ApiQuery({ name: 'spareTimeId', type: Number })
  async deleteSpareTime(
    @CurrentMember() member: Member,
    @Query('spareTimeId') spareTimeId: string,
  ) {
    await this.spareTimeService.delete(member, parseInt(spareTimeId, 10));
    return { message: '자투리 시간 삭제 성공' };
  }
}
