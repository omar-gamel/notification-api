import { Notification } from './models/notification.model';
import { generateGqlResponseType } from 'src/common/graphql/graphql-response.type';

export const GqlNotificationResponse = generateGqlResponseType(Notification);
export const GqlNotificationsResponse = generateGqlResponseType(Array(Notification));
