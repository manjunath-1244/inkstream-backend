import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    try {
      const result = await super.canActivate(context);
      console.log(
        `JwtAuthGuard: canActivate result for isPublic=${String(isPublic)}: ${String(!!result)}`,
      );
      if (result) {
        return true;
      }
    } catch (error: any) {
      console.log(
        `JwtAuthGuard: error in canActivate for isPublic=${isPublic}:`,
        error?.message as string,
      );
      if (isPublic) {
        return true;
      }
      throw error;
    }

    return isPublic;
  }

  handleRequest(
    err: any,
    user: any,
    _info: any,
    context: ExecutionContext,
  ): any {
    console.log(
      `JwtAuthGuard: handleRequest - user found: ${!!user}, err: ${!!err}`,
    );
    if (user) {
      return user;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return null;
    }

    throw err || new UnauthorizedException();
  }

  override getRequest(context: ExecutionContext) {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return gqlContext.getContext().req;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return context.switchToHttp().getRequest();
  }
}
