import { Field, ObjectType, Float } from '@nestjs/graphql';

export class FcmTokensType {
  android?: string;
  ios?: string;
  desktop?: string;
}

@ObjectType()
export class LocationType {
  @Field()
  type: string;

  @Field(() => [Float])
  coordinates: number[];
}
