import { IsString, IsOptional, IsInt, IsArray, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class UpdateRoutineDto {
  @ApiPropertyOptional({ example: '저녁 독서' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '20:00:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '21:00:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: 3600 })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional({
    example: ['TUE', 'THU'],
    enum: DayOfWeek,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  days?: DayOfWeek[];

  @ApiPropertyOptional({ example: 'notion' })
  @IsOptional()
  @IsString()
  linkApp?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  accountId?: number;
}
