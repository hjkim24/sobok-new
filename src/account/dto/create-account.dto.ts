import { IsString, IsOptional, IsInt, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: '2025년 목표 적금' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 30, description: '적금 기간 (일)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ example: 3600, description: '목표 달성 시간 (초)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  time?: number;

  @ApiPropertyOptional({ example: 0.05, description: '이자율 (0.0 ~ 1.0)' })
  @IsOptional()
  @IsNumber()
  interest?: number;
}
