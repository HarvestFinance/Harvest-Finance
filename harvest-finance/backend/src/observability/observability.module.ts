import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsModule } from './metrics/metrics.module';
import { HeapMonitorService } from './heap-monitor.service';
import { TracingService } from './tracing.service';
import { AuditService } from './audit.service';
import { AuditEvent } from '../database/entities/audit-event.entity';

@Global()
@Module({
  imports: [MetricsModule, TypeOrmModule.forFeature([AuditEvent])],
  providers: [HeapMonitorService, TracingService, AuditService],
  exports: [MetricsModule, HeapMonitorService, TracingService, AuditService],
})
export class ObservabilityModule {}
