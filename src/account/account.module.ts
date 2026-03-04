import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MemberModule } from '../member/member.module';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';

@Module({
  imports: [PrismaModule, MemberModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
