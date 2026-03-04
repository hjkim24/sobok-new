import { Injectable } from '@nestjs/common';
import type { Member } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiRecommendationService } from './ai-recommendation.service';
import { SurveyRequestDto } from './dto/survey-request.dto';

@Injectable()
export class SurveyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiRecommendationService,
  ) {}

  // ─── 설문 저장 + AI 루틴 생성 ────────────────────────────────────────────────

  async generateRoutine(member: Member, dto: SurveyRequestDto) {
    await this.saveSurvey(member, dto);

    const surveyData = {
      spareTpo: dto.spareTpo,
      spareTime: dto.spareTime,
      preference1: dto.preference1,
      preference2: dto.preference2,
      preference3: dto.preference3,
      likeOption: dto.likeOption,
      extraRequest: dto.extraRequest,
    };

    return this.aiService.generateAiRoutine(surveyData);
  }

  // ─── 설문 결과 조회 ───────────────────────────────────────────────────────────

  async getSurveyResult(member: Member) {
    const survey = await this.prisma.survey.findUnique({
      where: { memberId: member.id },
      include: { surveyLikeOptions: true, surveySpareTimes: true },
    });
    if (!survey) return null;

    return {
      spareTpo: survey.spareTpo,
      spareTime: survey.surveySpareTimes.map((s) => s.spareTime),
      preference1: survey.preference1,
      preference2: survey.preference2,
      preference3: survey.preference3,
      likeOption: survey.surveyLikeOptions.map((o) => o.likeOption),
      extraRequest: survey.extraRequest,
    };
  }

  // ─── 설문 삭제 ────────────────────────────────────────────────────────────────

  async deleteSurvey(member: Member) {
    await this.prisma.survey.deleteMany({ where: { memberId: member.id } });
  }

  // ─── 내부: 설문 저장 (upsert) ─────────────────────────────────────────────────

  private async saveSurvey(member: Member, dto: SurveyRequestDto) {
    await this.prisma.$transaction(async (tx) => {
      // 기존 설문이 있으면 삭제 후 재생성 (cascade)
      await tx.survey.deleteMany({ where: { memberId: member.id } });

      const survey = await tx.survey.create({
        data: {
          memberId: member.id,
          spareTpo: dto.spareTpo,
          preference1: dto.preference1,
          preference2: dto.preference2,
          preference3: dto.preference3,
          extraRequest: dto.extraRequest,
        },
      });

      await tx.surveySpareTime.createMany({
        data: dto.spareTime.map((st) => ({
          surveyId: survey.id,
          spareTime: st,
        })),
      });

      await tx.surveyLikeOption.createMany({
        data: dto.likeOption.map((opt) => ({
          surveyId: survey.id,
          likeOption: opt,
        })),
      });
    });
  }
}
