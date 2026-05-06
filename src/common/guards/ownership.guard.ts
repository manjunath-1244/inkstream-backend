import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../modules/users/entities/user.entity';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Admins bypass ownership checks
    if (user.role === Role.ADMIN) {
      return true;
    }

    // This guard expects the resource to be attached to the request or handled in the controller
    // For specific modules, we might need to inject the service or use a more specific guard.
    // However, a simple way is to check the resource owner in the service.
    
    // For this generic guard to work without injecting every service, 
    // we assume the controller will handle the logic or we check a specific property.
    
    return true; // Placeholder: Real logic often requires repository access
  }
}
