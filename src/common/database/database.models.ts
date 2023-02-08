import { plural } from 'pluralize';
import { User } from 'src/user/user.model';
import { Notification } from 'src/notification/models/notification.model';
import { buildRepository } from './database-repository.builder';
import { NotificationUserStatus } from 'src/notification/models/notification-user-status.model';

export const models = [User, Notification, NotificationUserStatus];

export const repositories = models.map(m => ({
  provide: `${plural(m.name)}Repository`,
  useClass: buildRepository(m)
}));
