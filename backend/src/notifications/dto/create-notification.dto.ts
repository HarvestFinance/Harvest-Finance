import { NotificationType } from '../../database/entities/notification.entity';

export class CreateNotificationDto {
  userId?: string | null;
  adminOnly?: boolean;
  title: string;
  message: string;
  type: NotificationType;
}
