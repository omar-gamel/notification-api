import { DeviceEnum } from './user.enum';
import { FcmTokensType } from './user.type';

export interface FcmTokenTransformerInput {
  fcmToken?: string;
  device?: DeviceEnum;
  userSavedFcmTokens?: FcmTokensType;
}
