import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Member } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentMember } from '../../common/decorators/current-member.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Member')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user/point')
export class PointController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('log')
  @ApiOperation({ summary: '포인트 내역 조회 (기간 미지정 시 이번 달)' })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
    example: '2025-01-31',
  })
  async getPointLogs(
    @CurrentMember() member: Member,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const logs = await this.prisma.pointLog.findMany({
      where: { memberId: member.id, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      logs: logs.map((l) => ({
        id: l.id,
        point: l.point,
        balance: l.balance,
        category: l.category,
        description: l.description,
        createdAt: l.createdAt,
      })),
    };
  }
}
