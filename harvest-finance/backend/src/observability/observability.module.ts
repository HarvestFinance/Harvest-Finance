import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from './metrics/metrics.module';
import { HeapMonitorService } from './heap-monitor.service';

@Module({
  imports: [MetricsModule, ConfigModule],
  providers: [HeapMonitorService],
  exports: [HeapMonitorService],
})
export class ObservabilityModule {}
