import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard kiểm tra X-User-Role header khớp với roles yêu cầu.
 * Phải dùng SAU GatewayAuthGuard để đảm bảo user đã đăng nhập.
 *
 * Sử dụng:
 *   @Roles('admin', 'moderator')
 *   @UseGuards(GatewayAuthGuard, RolesGuard)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // Nếu handler không gắn @Roles() → cho phép tất cả
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest();
    const userRole = request.headers['x-user-role'];

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
