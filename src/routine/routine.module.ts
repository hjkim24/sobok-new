import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountModule } from '../account/account.module';
import { RoutineService } from './routine.service';
import { RoutineController } from './routine.controller';

@Module({
  imports: [PrismaModule, AccountModule],
  controllers: [RoutineController],
  providers: [RoutineService],
  exports: [RoutineService],
})
export class RoutineModule {}
