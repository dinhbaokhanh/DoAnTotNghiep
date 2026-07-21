import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * InternalTokenGuard bảo vệ toàn bộ identity-service khỏi bị gọi thẳng
 * (bypass API Gateway).
 *
 * Gateway inject header X-Internal-Token vào mọi request trước khi forward
 * sang backend. Guard này kiểm tra header đó khớp với biến môi trường
 * INTERNAL_SERVICE_TOKEN — chỉ Gateway biết giá trị này.
 *
 * Nếu request không có header hoặc sai giá trị → 403 Forbidden.
 * Guard được đăng ký globally trong main.ts nên áp dụng cho MỌI endpoint.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  private readonly expectedToken: string;

  constructor() {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) {
      throw new Error(
        'CRITICAL: Missing environment variable INTERNAL_SERVICE_TOKEN — Identity Service refuses to start!',
      );
    }
    this.expectedToken = token;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<any>();
    const token: string | undefined = request.headers['x-internal-token'];

    if (!token || token !== this.expectedToken) {
      throw new ForbiddenException(
        'Direct access to this service is not allowed.',
      );
    }

    return true;
  }
}
