import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AchieveRoutineDto {
  @ApiProperty({ example: 3600, description: '실제 달성 시간 (초)' })
  @IsInt()
  duration: number;

  @ApiPropertyOptional({ example: '2025-01-01T07:00:00.000Z' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2025-01-01T08:00:00.000Z' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
