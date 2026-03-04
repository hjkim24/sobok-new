import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StatisticsService } from './statistics.service';
import { ReportService } from './report/report.service';
import { SnowCardService } from './snowcard/snowcard.service';
import {
  StatisticsController,
  ReportController,
  SnowCardController,
} from './statistics.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StatisticsController, ReportController, SnowCardController],
  providers: [StatisticsService, ReportService, SnowCardService],
  exports: [StatisticsService, ReportService],
})
export class StatisticsModule {}
