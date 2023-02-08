import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/user.model';
import { SendNotificationInput } from './inputs/send-notification.input';
import { BaseHttpException } from 'src/common/exceptions/base-http-exception';
import { FilterNotificationsInput } from './inputs/filter-notifications.input';
import { PaginatorInput } from 'src/common/paginator/paginator.input';
import { SetNotificationsInSeenStatusInput } from './inputs/set-notifications-in-seen-status.input';
import { PusherService } from 'src/pusher/pusher.service';
import { CONTEXT } from '@nestjs/graphql';
import { GqlContext } from 'src/common/graphql/graphql-context.type';
import { Op } from 'sequelize';
import { Notification } from './models/notification.model';
import { IRepository } from 'src/common/database/repository.interface';
import { NotificationUserStatus } from './models/notification-user-status.model';
import { Repositories } from 'src/common/database/database-repository.enum';
import { ManagePatientNotificationsInput } from './inputs/manage-patient-notification.input';
import { ManageDoctorNotificationsInput } from './inputs/manage-doctor-notifications.input';
import { SendNotificationBoardInput } from './inputs/send-notification-board.input';
import { NotificationTypeEnum, SendNotificationBoardTypeEnum } from './notification.enum';
import { ErrorCodeEnum } from 'src/common/exceptions/error-code.enum';

@Injectable()
export class NotificationService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(Repositories.NotificationsRepository)
    private readonly notificationRepo: IRepository<Notification>,
    @Inject(Repositories.NotificationUserStatusesRepository)
    private readonly notificationUserStatusRepo: IRepository<NotificationUserStatus>,
    @Inject(Repositories.UsersRepository) private readonly userRepo: IRepository<User>,
    private readonly pusherService: PusherService,
    @Inject(CONTEXT) private readonly context: GqlContext
  ) {}

  async notifications(filter: FilterNotificationsInput = {}, paginate: PaginatorInput = {}) {
    const notifications = await this.notificationRepo.findPaginated(
      {
        returnItToClient: true,
        ...(filter.searchKey && {
          [Op.or]: {
            enTitle: { [Op.iLike]: `%${filter.searchKey}%` },
            arTitle: { [Op.iLike]: `%${filter.searchKey}%` },
            enBody: { [Op.iLike]: `%${filter.searchKey}%` },
            arBody: { [Op.iLike]: `%${filter.searchKey}%` }
          }
        })
      },
      '-createdAt',
      paginate.page,
      paginate.limit,
      [
        {
          model: User,
          attributes: ['id'],
          required: true,
          through: { where: { receiverId: this.context.currentUser.id } }
        }
      ]
    );
    // const notificationIds = notifications.items.reduce((total, not) => {
    //   total.push(not.id);
    //   return total;
    // }, []);

    // // Set notification in seen status
    // await this.notificationUserStatusRepo.updateAll(
    //   { notificationId: { [Op.in]: notificationIds }, seenAt: null },
    //   { seenAt: new Date() }
    // );
    return notifications;
  }

  async notification(notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      id: notificationId
    });

    if (!notification) throw new BaseHttpException(ErrorCodeEnum.NOTIFICATION_DOES_NOT_EXIST);

    return notification;
  }

  async setNotificationsInSeenStatus(input: SetNotificationsInSeenStatusInput) {
    await this.notificationUserStatusRepo.updateAll(
      { seenAt: new Date() },
      { notificationId: { [Op.in]: input.notificationIds } }
    );
    return true;
  }

  async sendNotification(input: SendNotificationInput): Promise<boolean> {
    const users = await this.userRepo.findAll({ id: input.usersIds });
    await this.pusherService.push(
      users,
      {
        arBody: input.arBody,
        enBody: input.enBody,
        enTitle: input.enTitle,
        arTitle: input.arTitle,
        notificationType: input.notificationType,
        thumbnail: `${this.configService.get('API_BASE')}/default/logo.png`
      },
      this.context.currentUser
    );
    return true;
  }

  async sendNotificationBoard(input: SendNotificationBoardInput): Promise<boolean> {
    const { currentUser, lang } = this.context;
    const users = await this.userRepo.findAll({
      ...(input.userType === SendNotificationBoardTypeEnum.SPECIFIC_USERS && {
        id: input.usersIds
      })
    });
    await this.pusherService.push(
      users,
      {
        arBody: input.arBody,
        enBody: input.enBody,
        enTitle: input.enTitle,
        arTitle: input.arTitle,
        notificationType: NotificationTypeEnum.PUBLIC,
        thumbnail: `${this.configService.get('API_BASE')}/default/logo.png`,
        details: {
          type: input.userType || null,
          userIds: input.usersIds || null
        }
      },
      currentUser
    );
    return true;
  }

  async deleteNotification(notificationId: string) {
    const notification = await this.notificationRepo.findOne({ id: notificationId });
    if (!notification) throw new BaseHttpException(ErrorCodeEnum.NOTIFICATION_DOES_NOT_EXIST);

    const notificationUser = await this.notificationUserStatusRepo.findAll({
      notificationId: notification.id,
      receiverId: this.context.currentUser.id
    });
    if (!notificationUser) throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

    await this.notificationRepo.deleteAll({ id: notificationId });

    return true;
  }

  async deleteNotifications() {
    const notificationUsers = await this.notificationUserStatusRepo.findAll({
        receiverId: this.context.currentUser.id
      }),
      notificationIds = notificationUsers.map(n => n.notificationId);
    await this.notificationRepo.deleteAll({ id: { [Op.in]: notificationIds } });
    return true;
  }

  async manageMyNotifications(
    input: ManagePatientNotificationsInput | ManageDoctorNotificationsInput
  ): Promise<User> {
    const { currentUser } = this.context;
    let user = await this.userRepo.findOne({ id: currentUser.id });
    const patientInput = input as ManagePatientNotificationsInput;
    const doctorInput = input as ManageDoctorNotificationsInput;
    user = await this.userRepo.updateOneFromExistingModel(user, {
      notificationManager: {
        ...user.notificationManager,
        ...(patientInput.WHEN_APPOINTMENT_PRESCRIPTIONS_ADDED != undefined && {
          WHEN_APPOINTMENT_PRESCRIPTIONS_ADDED: patientInput.WHEN_APPOINTMENT_PRESCRIPTIONS_ADDED
        }),
        ...(input.VIA_PUSH != undefined && { VIA_PUSH: input.VIA_PUSH }),
        ...(patientInput.WHEN_APPOINTMENT_SICK_LEAVE_ADDED != undefined && {
          WHEN_APPOINTMENT_SICK_LEAVE_ADDED: patientInput.WHEN_APPOINTMENT_SICK_LEAVE_ADDED
        }),
        ...(patientInput.WHEN_APPOINTMENT_VISIT_SUMMARY_ADDED != undefined && {
          WHEN_APPOINTMENT_VISIT_SUMMARY_ADDED: patientInput.WHEN_APPOINTMENT_VISIT_SUMMARY_ADDED
        }),
        ...(patientInput.WHEN_APPOINTMENT_REPLIED != undefined && {
          WHEN_APPOINTMENT_REPLIED: patientInput.WHEN_APPOINTMENT_REPLIED
        }),
        ...(input.WHEN_SCHEDULED_APPOINTMENT_ALARM != undefined && {
          WHEN_SCHEDULED_APPOINTMENT_ALARM: input.WHEN_SCHEDULED_APPOINTMENT_ALARM
        }),
        ...(doctorInput.WHEN_APPOINTMENT_NEED_SUMMARY != undefined && {
          WHEN_APPOINTMENT_NEED_SUMMARY: doctorInput.WHEN_APPOINTMENT_NEED_SUMMARY
        }),
        ...(doctorInput.WHEN_APPOINTMENT_CANCELED != undefined && {
          WHEN_APPOINTMENT_CANCELED: doctorInput.WHEN_APPOINTMENT_CANCELED
        }),
        ...(doctorInput.WHEN_APPOINTMENT_REVIEWED != undefined && {
          WHEN_APPOINTMENT_REVIEWED: doctorInput.WHEN_APPOINTMENT_REVIEWED
        }),
        ...(doctorInput.WHEN_NEW_APPOINTMENT != undefined && {
          WHEN_NEW_APPOINTMENT: doctorInput.WHEN_NEW_APPOINTMENT
        }),
        ...(doctorInput.WHEN_APPOINTMENT_INCOME_ADDED_TO_DOCTOR_WALLET != undefined && {
          WHEN_APPOINTMENT_INCOME_ADDED_TO_DOCTOR_WALLET:
            doctorInput.WHEN_APPOINTMENT_INCOME_ADDED_TO_DOCTOR_WALLET
        })
      }
    });
    return user;
  }
}
