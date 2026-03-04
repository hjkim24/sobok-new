import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MemberModule } from '../member/member.module';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';

@Module({
  imports: [PrismaModule, MemberModule],
  controllers: [SmsController],
  providers: [SmsService],
})
export class SmsModule {}
