import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { SendNotificationBoardTypeEnum } from '../notification.enum';

@InputType()
export class SendNotificationBoardInput {
  @ValidateIf(o => o.userType.SPECIFIC_USERS)
  @IsOptional()
  @IsUUID('4', { each: true })
  @Field(type => [String], { nullable: 'itemsAndList' })
  usersIds?: string[];

  @IsNotEmpty()
  @IsString()
  @Field()
  enTitle: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  arTitle: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  enBody: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  arBody: string;

  @IsNotEmpty()
  @Field(type => SendNotificationBoardTypeEnum)
  userType: SendNotificationBoardTypeEnum;
}
