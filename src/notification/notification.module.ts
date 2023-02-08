import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import { PusherModule } from 'src/pusher/pusher.module';

@Module({
  imports: [PusherModule],
  providers: [NotificationService, NotificationResolver],
  exports: [NotificationService]
})
export class NotificationModule {}
