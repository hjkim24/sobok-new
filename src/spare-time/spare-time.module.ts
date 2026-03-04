import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpareTimeService } from './spare-time.service';
import { SpareTimeController } from './spare-time.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SpareTimeController],
  providers: [SpareTimeService],
  exports: [SpareTimeService],
})
export class SpareTimeModule {}
