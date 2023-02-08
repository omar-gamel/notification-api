import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Repositories } from 'src/common/database/database-repository.enum';
import { IRepository } from 'src/common/database/repository.interface';
import { User } from 'src/user/user.model';
import { HelperService } from 'src/common/utils/helper.service';

@Injectable()
export class UserService {
  constructor(
    private readonly config: ConfigService,
    private readonly helperService: HelperService,
    @Inject(Repositories.UsersRepository) private readonly userRepo: IRepository<User>
  ) {}

  private generateAuthToken(id: string): string {
    return jwt.sign({ userId: id }, this.config.get('JWT_SECRET'));
  }

  private appendAuthTokenToUser(user: User) {
    return Object.assign(user, { token: this.generateAuthToken(user.id) });
  }

  async createTestUser() {
    const user = await this.userRepo.createOne({
      firstName: 'omar',
      slug: this.helperService.slugify(`omar`)
    });
    return this.appendAuthTokenToUser(user);
  }
}
