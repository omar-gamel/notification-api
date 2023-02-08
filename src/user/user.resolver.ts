import { Resolver, ResolveField, Mutation, Args, Context, Parent, Query } from '@nestjs/graphql';
import { User } from './user.model';
import { UserService } from './user.service';
import { GqlUserResponse } from './user-response.type';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}
  @Mutation(returns => GqlUserResponse)
  async createTestUser() {
    return await this.userService.createTestUser();
  }
}
