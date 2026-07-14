import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiQueryHistory } from './entities/ai-query-history.entity';
import { AiQueryHistoryService } from './ai-query-history.service';
import { AiQueryHistoryController } from './ai-query-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiQueryHistory])],
  controllers: [AiQueryHistoryController],
  providers: [AiQueryHistoryService],
  exports: [AiQueryHistoryService],
})
export class AiQueryHistoryModule {}
