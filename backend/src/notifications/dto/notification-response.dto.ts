import { NotificationType } from '../../database/entities/notification.entity';

export class NotificationResponseDto {
  id: string;
  userId: string | null;
  adminOnly: boolean;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
