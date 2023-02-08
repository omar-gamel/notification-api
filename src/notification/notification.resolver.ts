import { Resolver, Args, Mutation, Query, ResolveField, Parent, Context } from '@nestjs/graphql';
import { User } from 'src/user/user.model';
import { UseGuards } from '@nestjs/common';
import { Notification } from './models/notification.model';
import { NotificationService } from './notification.service';
import { GqlNotificationsResponse, GqlNotificationResponse } from './notification-response.type';
import { NullablePaginatorInput } from 'src/common/paginator/paginator.input';
import { NullableFilterNotificationsInput } from './inputs/filter-notifications.input';
import { GqlBooleanResponse } from 'src/common/graphql/graphql-response.type';
import { Timestamp } from 'src/common/graphql/timestamp.scalar';
import { SetNotificationsInSeenStatusInput } from './inputs/set-notifications-in-seen-status.input';
import { AuthGuard } from 'src/common/auth/auth.guard';
import { ManagePatientNotificationsInput } from './inputs/manage-patient-notification.input';
import { ManageDoctorNotificationsInput } from './inputs/manage-doctor-notifications.input';
import { ValidUserGuard } from 'src/common/auth/valid-user.guard';
import { SendNotificationBoardInput } from './inputs/send-notification-board.input';
import { GqlUserResponse } from 'src/user/user-response.type';

@UseGuards(AuthGuard)
@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  //** --------------------- QUERIES --------------------- */

  @Query(returns => GqlNotificationsResponse)
  async notifications(
    @Args() filter: NullableFilterNotificationsInput,
    @Args() paginate: NullablePaginatorInput
  ) {
    return await this.notificationService.notifications(filter.filter, paginate.paginate);
  }

  @Query(returns => GqlNotificationResponse)
  async notification(@Args('notificationId') notificationId: string) {
    return await this.notificationService.notification(notificationId);
  }

  @Query(returns => GqlBooleanResponse)
  async setNotificationsInSeenStatus(@Args('input') input: SetNotificationsInSeenStatusInput) {
    return await this.notificationService.setNotificationsInSeenStatus(input);
  }

  // //** --------------------- MUTATIONS --------------------- */

  @Mutation(returns => GqlBooleanResponse)
  async sendNotificationBoard(@Args('input') input: SendNotificationBoardInput) {
    return await this.notificationService.sendNotificationBoard(input);
  }

  @Mutation(returns => GqlBooleanResponse)
  async deleteNotification(@Args('notificationId') notificationId: string) {
    return await this.notificationService.deleteNotification(notificationId);
  }

  @Mutation(returns => GqlBooleanResponse)
  async deleteNotifications() {
    return await this.notificationService.deleteNotifications();
  }

  @UseGuards(ValidUserGuard)
  @Mutation(returns => GqlUserResponse)
  async managePatientNotifications(@Args('input') input: ManagePatientNotificationsInput) {
    return await this.notificationService.manageMyNotifications(input);
  }

  @UseGuards(ValidUserGuard)
  @Mutation(returns => GqlUserResponse)
  async manageDoctorNotifications(@Args('input') input: ManageDoctorNotificationsInput) {
    return await this.notificationService.manageMyNotifications(input);
  }

  //** ------------------ RESOLVE FIELDS ------------------ */

  @ResolveField(type => Timestamp)
  createdAt(@Parent() notification) {
    return new Date(notification.createdAt).valueOf();
  }

  @ResolveField(type => Timestamp)
  updatedAt(@Parent() notification) {
    return new Date(notification.updatedAt).valueOf();
  }

  @ResolveField(type => String, { nullable: true })
  localeTitle(@Context('currentUser') currentUser: User, @Parent() notification) {
    const lang = currentUser?.favLang || 'EN';
    return notification[`${lang.toLowerCase()}Title`];
  }

  @ResolveField(type => String, { nullable: true })
  localeBody(@Context('currentUser') currentUser: User, @Parent() notification) {
    const lang = currentUser?.favLang || 'EN';
    return notification[`${lang.toLowerCase()}Body`];
  }

  //** --------------------- DATALOADER --------------------- */
}
