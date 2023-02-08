import { InputType, Field, ArgsType } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class FilterNotificationsInput {
  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  searchKey?: string;
}

@ArgsType()
export class NullableFilterNotificationsInput {
  @IsOptional()
  @Field(type => FilterNotificationsInput, { nullable: true })
  filter?: FilterNotificationsInput;
}
