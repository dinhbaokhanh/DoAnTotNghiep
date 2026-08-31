import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * GatewayAuthGuard kiểm tra X-User-ID header tồn tại.
 *
 * Gateway đã verify JWT và inject header trước khi forward request.
 * Guard này chỉ đảm bảo route yêu cầu đăng nhập có user context.
 *
 * Khác với JwtAuthGuard trong identity-service (verify JWT trực tiếp),
 * guard này chỉ đọc header — KHÔNG verify JWT.
 */
@Injectable()
export class GatewayAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return true;
  }
}
