import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PinoLogger } from 'nestjs-pino';
import { LoggerModule } from './common/logger/logger.module';
import { ValidationPipe } from './common/exceptions/validation.pipe';
import { UserModule } from './user/user.module';
import { PusherModule } from 'src/pusher/pusher.module';
import { DatabaseModule } from 'src/common/database/database.module';
import { GqlConfigService } from './common/graphql/graphql.provider';
import { ContextModule } from './common/context/context.module';
import { PubSub } from './common/graphql/graphql.pubsub';
import { HttpExceptionFilter } from './common/exceptions/exception-filter';
import { HelperModule } from './common/utils/helper.module';
import { NotificationModule } from './notification/notification.module';
import { Timestamp } from 'src/common/graphql/timestamp.scalar';
import { JSON } from 'src/common/graphql/json.scalar';
import { GqlResponseInterceptor } from './common/graphql/graphql-response.interceptor';

@Module({
  imports: [
    UserModule,
    PusherModule,
    DatabaseModule,
    LoggerModule,
    NotificationModule,
    HelperModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: +configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASS')
        }
      }),
      inject: [ConfigService]
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useClass: GqlConfigService,
      imports: [ContextModule]
    })
  ],
  providers: [
    PubSub,
    Timestamp,
    JSON,
    { provide: APP_PIPE, useClass: ValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (logger: PinoLogger) => new GqlResponseInterceptor(logger),
      inject: [PinoLogger]
    }
  ]
})
export class AppModule {}
