import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { ExportModule } from '../export/export.module';
import { NotificationProcessor } from './processors/notification.processor';
import { ExportProcessor } from './processors/export.processor';
import { QUEUE_EXPORTS, QUEUE_NOTIFICATIONS } from './queue.constants';
import { QueueProducerService } from './queue-producer.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          // Uses the same Redis URL as the cache layer.
          url: configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,  // keep the last 100 completed jobs for inspection
          removeOnFail: 200,      // keep the last 200 failed jobs for debugging
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NOTIFICATIONS },
      { name: QUEUE_EXPORTS },
      { 
        name: 'oracle',
        defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 200 }
      },
      { 
        name: 'yield',
        defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 200 }
      }
    ),
    NotificationsModule,
    ExportModule,
  ],
  providers: [NotificationProcessor, ExportProcessor, QueueProducerService],
  exports: [QueueProducerService, BullModule],
})
export class QueuesModule {}
