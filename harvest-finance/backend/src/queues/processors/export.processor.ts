import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_GENERATE_EXPORT, QUEUE_EXPORTS } from '../queue.constants';
import { ExportService, TransactionExportData } from '../../export/export.service';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface GenerateExportJobData {
  userId: string;
  format: ExportFormat;
  requestedAt: string;
}

export interface ExportJobResult {
  userId: string;
  format: ExportFormat;
  /** Base64-encoded file content for small exports, or a signed S3 URL for large ones. */
  content?: string;
  rowCount: number;
}

/**
 * Processes export generation jobs asynchronously.
 * For large datasets, offloading to a worker prevents HTTP timeouts and
 * reduces peak RSS by not holding the buffer on the request thread.
 */
@Processor(QUEUE_EXPORTS, { concurrency: 2 })
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(private readonly exportService: ExportService) {
    super();
  }

  async process(job: Job<GenerateExportJobData>): Promise<ExportJobResult> {
    if (job.name !== JOB_GENERATE_EXPORT) {
      throw new Error(`Unknown job name: ${job.name}`);
    }

    const { userId, format } = job.data;
    this.logger.log(`Processing export job ${job.id} for user ${userId} format=${format}`);

    const data: TransactionExportData[] = await this.exportService.getTransactionData(userId);

    let content: string;
    if (format === 'csv') {
      const csv = await this.exportService.generateCsv(data);
      content = Buffer.from(csv).toString('base64');
    } else if (format === 'excel') {
      const buf = await this.exportService.generateExcel(data);
      content = buf.toString('base64');
    } else {
      const buf = await this.exportService.generatePdf(data);
      content = buf.toString('base64');
    }

    this.logger.log(`Export job ${job.id} complete — ${data.length} rows`);
    return { userId, format, content, rowCount: data.length };
  }
}
