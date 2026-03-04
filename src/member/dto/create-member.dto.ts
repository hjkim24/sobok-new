import { IsString, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMemberDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'Password1!' })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/,
    {
      message:
        '비밀번호는 8~16자, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.',
    },
  )
  password: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  name: string;

  @ApiProperty({ example: '길동이' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '010-1234-5678' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsString()
  birth: string;
}
