import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class CreateRoutineDto {
  @ApiProperty({ example: '아침 독서' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '07:00:00', description: 'HH:mm:ss 형식' })
  @IsOptional()
  @IsString()
  startTime?: string; // ISO 문자열로 입력받아 파싱

  @ApiPropertyOptional({ example: '08:00:00', description: 'HH:mm:ss 형식' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: 3600, description: '루틴 목표 시간 (초)' })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({
    example: ['MON', 'WED', 'FRI'],
    enum: DayOfWeek,
    isArray: true,
  })
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  days: DayOfWeek[];

  @ApiPropertyOptional({ example: 'youtube', description: '연동 앱 이름' })
  @IsOptional()
  @IsString()
  linkApp?: string;

  @ApiPropertyOptional({ example: 1, description: '연결할 적금 계좌 ID' })
  @IsOptional()
  @IsInt()
  accountId?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isAiRoutine?: boolean;
}
