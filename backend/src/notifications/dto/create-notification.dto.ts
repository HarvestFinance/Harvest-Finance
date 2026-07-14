import { NotificationType } from '../../database/entities/notification.entity';

export class CreateNotificationDto {
  userId?: string;
  adminOnly?: boolean;
  title: string;
  message: string;
  type: NotificationType;
}
