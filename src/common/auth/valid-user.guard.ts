import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { BaseHttpException } from 'src/common/exceptions/base-http-exception';
import { ErrorCodeEnum } from 'src/common/exceptions/error-code.enum';
import { GqlContext } from 'src/common/graphql/graphql-context.type';

@Injectable()
export class ValidUserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { currentUser } = ctx.getContext() as GqlContext;

    if (!currentUser) throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
    if (currentUser.isBlocked) throw new BaseHttpException(ErrorCodeEnum.BLOCKED_USER);

    return true;
  }
}
