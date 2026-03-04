import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { AccountModule } from './account/account.module';
import { RoutineModule } from './routine/routine.module';
import { SpareTimeModule } from './spare-time/spare-time.module';
import { CategoryModule } from './category/category.module';
import { NotificationModule } from './notification/notification.module';
import { SurveyModule } from './survey/survey.module';
import { StatisticsModule } from './statistics/statistics.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    MemberModule,
    AccountModule,
    RoutineModule,
    SpareTimeModule,
    CategoryModule,
    NotificationModule,
    SurveyModule,
    StatisticsModule,
    SmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
