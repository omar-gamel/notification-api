import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { BaseHttpException } from 'src/common/exceptions/base-http-exception';
import { GqlContext } from 'src/common/graphql/graphql-context.type';
import { ErrorCodeEnum } from 'src/common/exceptions/error-code.enum';
import { IContextAuthService, IContextAuthServiceToken } from '../context/context-auth.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(IContextAuthServiceToken) private readonly authService: IContextAuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.get<string[]>('permissions', context.getHandler());
    const ctx = GqlExecutionContext.create(context);
    const { currentUser } = ctx.getContext() as GqlContext;

    if (!currentUser) throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
    if (
      permissions &&
      permissions.length &&
      !this.authService.hasPermission(permissions[0], currentUser)
    )
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

    return true;
  }
}
