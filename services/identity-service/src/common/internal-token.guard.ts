import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

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
 *
 * Bảo vệ timing attack:
 * So sánh bằng `timingSafeEqual` (constant-time) thay vì `===` (short-circuit).
 * `===` dừng sớm khi gặp ký tự sai → kẻ tấn công đo độ trễ để đoán từng byte.
 * `timingSafeEqual` luôn chạy đủ thời gian bất kể vị trí sai ở đâu.
 * Hai buffer phải cùng độ dài trước khi so sánh — nếu khác độ dài thì từ chối luôn.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  private readonly expectedTokenBuffer: Buffer;

  constructor() {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) {
      throw new Error(
        'CRITICAL: Missing environment variable INTERNAL_SERVICE_TOKEN — Identity Service refuses to start!',
      );
    }
    // Cache Buffer một lần khi khởi động, tránh allocate mỗi request
    this.expectedTokenBuffer = Buffer.from(token, 'utf8');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<any>();
    const token: string | undefined = request.headers['x-internal-token'];

    // Từ chối ngay nếu thiếu header — không cần so sánh
    if (!token) {
      throw new ForbiddenException(
        'Direct access to this service is not allowed.',
      );
    }

    const receivedBuffer = Buffer.from(token, 'utf8');
    const lengthMatch =
      receivedBuffer.byteLength === this.expectedTokenBuffer.byteLength;
    const valueMatch =
      lengthMatch && timingSafeEqual(receivedBuffer, this.expectedTokenBuffer);

    if (!valueMatch) {
      throw new ForbiddenException(
        'Direct access to this service is not allowed.',
      );
    }

    return true;
  }
}
