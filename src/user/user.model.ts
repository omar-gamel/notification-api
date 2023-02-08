import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  AllowNull,
  Default,
  Unique,
  CreatedAt,
  UpdatedAt,
  HasMany,
  ForeignKey,
  BelongsToMany,
  BelongsTo
} from 'sequelize-typescript';
import { ID, Field, ObjectType, Float } from '@nestjs/graphql';
import { LangEnum } from './user.enum';
import { manualPaginator, paginate } from '../common/paginator/paginator.service';
import { Notification } from '../notification/models/notification.model';
import { NotificationManagerEnum } from '../notification/notification.enum';
import { NotificationManager } from 'src/notification/notification.type';
import { getColumnEnum } from '../common/utils/columnEnum';
import { NotificationUserStatus } from 'src/notification/models/notification-user-status.model';
import { FcmTokensType } from './user.type';


@Table({
  timestamps: true,
  tableName: 'Users',
  indexes: [{ fields: [{ name: 'isBlocked' }] }]
})
@ObjectType()
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @AllowNull(false)
  @Column
  @Field()
  firstName: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  fullName?: string;

  @Unique
  @AllowNull(false)
  @Column
  @Field()
  slug: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  phone?: string;

  @AllowNull(true)
  @Column
  password?: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  profilePicture?: string;

  @Default(false)
  @AllowNull(false)
  @Column
  @Field()
  isBlocked: boolean;

  @Default(LangEnum.EN)
  @AllowNull(false)
  @Column({ type: getColumnEnum(LangEnum) })
  @Field(() => LangEnum)
  favLang: LangEnum;

  // ______________________________________________________________________________

  @Default({ android: null, ios: null, desktop: null })
  @AllowNull(false)
  @Column({ type: DataType.JSONB })
  fcmTokens: FcmTokensType;

  @BelongsToMany(() => Notification, () => NotificationUserStatus)
  notifications?: Array<Notification & { NotificationUserStatus: NotificationUserStatus }>;

  @Default(
    Object.keys(NotificationManagerEnum).reduce((total, k) => {
      total[k] = true;
      return total;
    }, {})
  )
  @AllowNull(false)
  @Column({ type: DataType.JSONB })
  @Field(() => NotificationManager)
  notificationManager: NotificationManager;

  // ______________________________________________________________________________

  @Field({ nullable: true })
  token?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;

  static async paginate(filter = {}, sort = '-createdAt', page = 0, limit = 15, include: any = []) {
    return paginate<User>(this, filter, sort, page, limit, include);
  }

  static paginateManually(data: User[], page = 0, limit = 15) {
    return manualPaginator<User>(data, {}, '-createdAt', page, limit);
  }
}
