import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface SurveyData {
  spareTpo?: string | null;
  spareTime: string[];
  preference1?: string | null;
  preference2?: string | null;
  preference3?: string | null;
  likeOption: string[];
  extraRequest?: string | null;
}

@Injectable()
export class AiRecommendationService {
  private readonly logger = new Logger(AiRecommendationService.name);
  private readonly openai: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY', ''),
    });
  }

  async generateAiRoutine(survey: SurveyData): Promise<Record<string, any>> {
    const prompt = this.createPromptFromSurvey(survey);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '너는 사용자의 루틴을 생성하는 AI야.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content ?? '{}';
      return JSON.parse(content);
    } catch (e) {
      this.logger.error('AI 루틴 생성 실패', e);
      throw new Error('AI 루틴 생성 중 오류가 발생했습니다.');
    }
  }

  private createPromptFromSurvey(survey: SurveyData): string {
    return `다음 정보를 바탕으로 개인 맞춤형 루틴을 생성해 줘:
자투리 시간이 생기는 상황: ${survey.spareTpo ?? ''}
자투리 시간: ${survey.spareTime.join(', ')}
루틴 속성: ${survey.preference1 ?? ''}, ${survey.preference2 ?? ''}, ${survey.preference3 ?? ''}
취향: ${survey.likeOption.join(', ')}
요청사항: ${survey.extraRequest ?? ''}
다음과 같은 JSON 형식으로 결과를 제공해줘.
이 때 duration의 단위는 분이야.(예시):
[
  {
    "title": "아침 운동",
    "start_time": "06:00",
    "end_time": "07:00",
    "duration": "60"
  }
]
여기서 루틴 리스트의 키는 todos야.
또한 해당 루틴을 포괄하는 제목도 제공해줘. 키는 title이야.
응답 값을 바로 사용할 수 있도록 JSON 형식으로 제공해줘.`;
  }
}
