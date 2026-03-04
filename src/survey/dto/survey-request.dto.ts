import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SurveyRequestDto {
  @ApiPropertyOptional({ example: '출근길' })
  @IsOptional()
  @IsString()
  spareTpo?: string;

  @ApiProperty({ example: ['아침 7-8시', '점심 12-13시'], isArray: true })
  @IsArray()
  spareTime: string[];

  @ApiPropertyOptional({ example: '짧고 굵게' })
  @IsOptional()
  @IsString()
  preference1?: string;

  @ApiPropertyOptional({ example: '꾸준히' })
  @IsOptional()
  @IsString()
  preference2?: string;

  @ApiPropertyOptional({ example: '혼자서' })
  @IsOptional()
  @IsString()
  preference3?: string;

  @ApiProperty({ example: ['독서', '운동'], isArray: true })
  @IsArray()
  likeOption: string[];

  @ApiPropertyOptional({ example: '취미 관련 루틴 위주로 만들어줘' })
  @IsOptional()
  @IsString()
  extraRequest?: string;
}
