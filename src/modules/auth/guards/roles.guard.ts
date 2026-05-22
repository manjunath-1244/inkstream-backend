import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    
    let user;
    if (context.getType<string>() === 'graphql') {
      const { GqlExecutionContext } = require('@nestjs/graphql');
      const gqlContext = GqlExecutionContext.create(context);
      user = gqlContext.getContext().req?.user;
    } else {
      user = context.switchToHttp().getRequest().user;
    }

    console.log('RolesGuard -> Context Type:', context.getType<string>());
    console.log('RolesGuard -> User from req:', user);
    console.log('RolesGuard -> Required Roles:', requiredRoles);

    return requiredRoles.some((role) => user?.role === role);
  }
}
