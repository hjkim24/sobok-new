import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Member } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentMember } from '../common/decorators/current-member.decorator';
import { SurveyService } from './survey.service';
import { SurveyRequestDto } from './dto/survey-request.dto';

@ApiTags('Survey')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '설문 저장 + AI 루틴 생성' })
  async generateRoutine(
    @CurrentMember() member: Member,
    @Body() dto: SurveyRequestDto,
  ) {
    const result = await this.surveyService.generateRoutine(member, dto);
    return { aiRoutine: result, message: 'AI 루틴 생성 완료' };
  }

  @Get('result')
  @ApiOperation({ summary: '설문 결과 조회' })
  async getSurveyResult(@CurrentMember() member: Member) {
    const result = await this.surveyService.getSurveyResult(member);
    if (!result) return { message: '설문 결과가 존재하지 않습니다.' };
    return result;
  }

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '설문 삭제' })
  async deleteSurvey(@CurrentMember() member: Member) {
    await this.surveyService.deleteSurvey(member);
    return { message: '설문 삭제 성공' };
  }
}
