import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator((fieldName, ctx: ExecutionContext) => {
  const gqlCtx = GqlExecutionContext.create(ctx);
  const { currentUser } = gqlCtx.getContext();
  if (!currentUser) return false;
  if (fieldName) return currentUser[fieldName];
  return currentUser;
});
