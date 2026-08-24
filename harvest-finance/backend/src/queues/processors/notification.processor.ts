import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from '../../notifications/notifications.service';
import { JOB_SEND_NOTIFICATION, QUEUE_NOTIFICATIONS } from '../queue.constants';
import { CreateNotificationDto } from '../../notifications/dto/create-notification.dto';

export interface SendNotificationJobData {
  notification: CreateNotificationDto;
}

/**
 * Processes notification jobs off the request thread.
 * Workers run asynchronously so deposit/withdrawal handlers return immediately
 * without waiting for DB writes in NotificationsService.
 */
@Processor(QUEUE_NOTIFICATIONS, {
  concurrency: parseInt(process.env.NOTIFICATION_WORKER_CONCURRENCY || '5', 10),
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<SendNotificationJobData>): Promise<void> {
    if (job.name !== JOB_SEND_NOTIFICATION) return;

    const { notification } = job.data;
    this.logger.debug(`Processing notification job ${job.id} for user ${notification.userId}`);

    try {
      await this.notificationsService.create(notification);
    } catch (err) {
      this.logger.error(
        `Failed to create notification for user ${notification.userId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      // Re-throw so BullMQ marks the job as failed and respects retry config.
      throw err;
    }
  }
}
