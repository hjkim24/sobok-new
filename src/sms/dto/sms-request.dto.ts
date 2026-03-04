import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SmsRequestDto {
  @ApiProperty({ example: '01012345678', description: '전화번호 (숫자만)' })
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 전화번호 형식이 아닙니다.' })
  phoneNumber: string;

  @ApiPropertyOptional({
    example: '123456',
    description: '인증 코드 (verify 시 필요)',
  })
  @IsOptional()
  @IsString()
  code?: string;
}
