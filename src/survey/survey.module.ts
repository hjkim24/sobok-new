import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiRecommendationService } from './ai-recommendation.service';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SurveyController],
  providers: [AiRecommendationService, SurveyService],
})
export class SurveyModule {}
