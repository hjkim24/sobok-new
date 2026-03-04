import { IsString, IsOptional, IsInt, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class CreateSpareTimeDto {
  @ApiPropertyOptional({ example: '출근 전 자투리' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: '07:00', description: 'HH:mm 형식' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '08:00', description: 'HH:mm 형식' })
  @IsString()
  endTime: string;

  @ApiProperty({
    example: ['MON', 'WED', 'FRI'],
    enum: DayOfWeek,
    isArray: true,
  })
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  days: DayOfWeek[];
}

export class UpdateSpareTimeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiPropertyOptional({ example: '점심 자투리' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '13:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: ['TUE', 'THU'], enum: DayOfWeek, isArray: true })
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  days: DayOfWeek[];
}
