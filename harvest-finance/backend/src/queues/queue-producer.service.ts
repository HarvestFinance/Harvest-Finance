import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  JOB_GENERATE_EXPORT,
  JOB_SEND_NOTIFICATION,
  QUEUE_EXPORTS,
  QUEUE_NOTIFICATIONS,
} from './queue.constants';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import { ExportFormat } from './processors/export.processor';

@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);

  constructor(
    @InjectQueue(QUEUE_NOTIFICATIONS) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_EXPORTS) private readonly exportQueue: Queue,
  ) {}

  /**
   * Enqueue a notification to be created asynchronously.
   * Returns immediately — the caller does not wait for persistence.
   */
  async enqueueNotification(notification: CreateNotificationDto): Promise<void> {
    await this.notificationQueue.add(
      JOB_SEND_NOTIFICATION,
      { notification },
      { priority: notification.adminOnly ? 5 : 10 },
    );
    this.logger.debug(`Enqueued notification for user ${notification.userId}`);
  }

  /**
   * Enqueue an export generation job.
   * @returns The Bull job ID so the caller can poll for completion.
   */
  async enqueueExport(userId: string, format: ExportFormat): Promise<string> {
    const job = await this.exportQueue.add(JOB_GENERATE_EXPORT, {
      userId,
      format,
      requestedAt: new Date().toISOString(),
    });
    this.logger.log(`Enqueued export job ${job.id} for user ${userId} format=${format}`);
    return job.id as string;
  }
}
