import { UserService } from './user.service';
import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { HelperModule } from 'src/common/utils/helper.module';

@Module({
  imports: [HelperModule],
  providers: [UserService, UserResolver]
})
export class UserModule {}
