import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    if (ctx.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(ctx);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return gqlContext.getContext().req?.user;
    }
    const request = ctx.switchToHttp().getRequest<any>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return request?.user;
  },
);

