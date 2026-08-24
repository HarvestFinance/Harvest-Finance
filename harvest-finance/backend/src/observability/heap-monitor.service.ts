import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HeapSnapshot {
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  rssMB: number;
  heapUsedPercent: number;
}

/**
 * HeapMonitorService
 *
 * Provides lightweight memory instrumentation for batch/bulk operations.
 * Inject this service into any processor or scheduled job to:
 *   1. Snapshot heap usage before and after a batch.
 *   2. Log a warning if heap growth exceeds a configurable threshold.
 *   3. Log an error alert if absolute heap usage exceeds the danger threshold.
 *
 * Thresholds (env vars):
 *   HEAP_WARN_GROWTH_MB   — warn if a single batch grows heap by this many MB (default: 50)
 *   HEAP_ALERT_USED_MB    — error-alert if used heap exceeds this absolute value in MB (default: 512)
 *
 * Usage:
 *   const before = this.heap.snapshot();
 *   await doExpensiveBatchWork();
 *   this.heap.checkGrowth('SorobanIndexer.pollEvents', before);
 */
@Injectable()
export class HeapMonitorService {
  private readonly logger = new Logger(HeapMonitorService.name);
  private readonly warnGrowthMB: number;
  private readonly alertUsedMB: number;

  constructor(private readonly configService: ConfigService) {
    this.warnGrowthMB = parseInt(
      configService.get<string>('HEAP_WARN_GROWTH_MB') || '50',
      10,
    );
    this.alertUsedMB = parseInt(
      configService.get<string>('HEAP_ALERT_USED_MB') || '512',
      10,
    );
  }

  /** Capture current V8 heap metrics. */
  snapshot(): HeapSnapshot {
    const mem = process.memoryUsage();
    const toMB = (b: number) => Math.round(b / 1024 / 1024);
    const heapUsedMB = toMB(mem.heapUsed);
    const heapTotalMB = toMB(mem.heapTotal);
    return {
      heapUsedMB,
      heapTotalMB,
      externalMB: toMB(mem.external),
      rssMB: toMB(mem.rss),
      heapUsedPercent:
        heapTotalMB > 0
          ? Math.round((heapUsedMB / heapTotalMB) * 100)
          : 0,
    };
  }

  /**
   * Compare current heap to a previously captured snapshot and emit
   * warnings / alerts when thresholds are breached.
   *
   * @param context  Human-readable label for log messages (e.g. 'SorobanIndexer.pollEvents')
   * @param before   Snapshot taken before the batch started
   */
  checkGrowth(context: string, before: HeapSnapshot): HeapSnapshot {
    const after = this.snapshot();
    const growthMB = after.heapUsedMB - before.heapUsedMB;

    if (after.heapUsedMB >= this.alertUsedMB) {
      this.logger.error(
        `[HeapAlert] ${context} — heap used ${after.heapUsedMB} MB ≥ alert threshold ${this.alertUsedMB} MB. ` +
          `Consider scaling up or reducing batch size. rss=${after.rssMB} MB`,
      );
    } else if (growthMB >= this.warnGrowthMB) {
      this.logger.warn(
        `[HeapWarn] ${context} — batch grew heap by ${growthMB} MB ` +
          `(before=${before.heapUsedMB} MB, after=${after.heapUsedMB} MB). ` +
          `Threshold=${this.warnGrowthMB} MB.`,
      );
    } else {
      this.logger.debug(
        `[Heap] ${context} — Δ${growthMB > 0 ? '+' : ''}${growthMB} MB | ` +
          `used=${after.heapUsedMB}/${after.heapTotalMB} MB (${after.heapUsedPercent}%)`,
      );
    }

    return after;
  }

  /**
   * Convenience wrapper: run an async function and automatically check heap
   * growth before/after.
   *
   * @example
   *   const result = await this.heap.monitor('SorobanIndexer.pollEvents', () => this.runOnce());
   */
  async monitor<T>(context: string, fn: () => Promise<T>): Promise<T> {
    const before = this.snapshot();
    try {
      return await fn();
    } finally {
      this.checkGrowth(context, before);
    }
  }
}
