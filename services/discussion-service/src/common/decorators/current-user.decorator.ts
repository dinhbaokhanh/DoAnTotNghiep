import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Thông tin user được Gateway inject qua HTTP headers.
 * Không cần verify JWT — Gateway đã làm việc này.
 */
export interface GatewayUser {
  id: string | null;
  role: string | null;
}

/**
 * Decorator đọc X-User-ID và X-User-Role từ request headers.
 *
 * Khác với identity-service dùng JwtAuthGuard (verify JWT trực tiếp),
 * Discussion Service chỉ đọc header do Gateway inject sau khi verify.
 *
 * Sử dụng:
 *   @Get()
 *   getPost(@CurrentUser() user: GatewayUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): GatewayUser => {
    const request = ctx.switchToHttp().getRequest();
    const id = request.headers['x-user-id'] || null;
    const role = request.headers['x-user-role'] || null;
    return { id, role };
  },
);
