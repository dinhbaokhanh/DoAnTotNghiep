import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/redis.provider';

/**
 * OtpService quản lý vòng đời của mã OTP (One-Time Password) 6 chữ số.
 * OTP được lưu trong Redis với TTL (thời gian sống) — tự hết hạn mà không cần cron job.
 *
 * Bảo vệ chống brute-force:
 * - Sau MAX_ATTEMPTS lần sai, key bị khóa thêm LOCKOUT_SECONDS giây.
 * - Trong thời gian khóa, mọi lần thử đều bị từ chối với 429.
 * - Lock key tự xóa sau khi hết TTL — không cần cleanup thủ công.
 *
 * Key convention trong Redis:
 *   otp:<key>          — giá trị OTP
 *   otp_fail:<key>     — số lần sai liên tiếp
 *   otp_lock:<key>     — khóa brute-force (tồn tại = đang bị khóa)
 */
@Injectable()
export class OtpService {
  private static readonly MAX_ATTEMPTS = 5;       // Số lần sai tối đa trước khi khóa
  private static readonly LOCKOUT_SECONDS = 300;  // Thời gian khóa: 5 phút

  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  // randomInt() dùng CSPRNG của OS — không thể dự đoán như Math.random()
  private generateCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  /**
   * Tạo OTP mới, reset fail counter, và lưu vào Redis với TTL cho trước.
   * Ghi đè OTP cũ nếu đã tồn tại (trường hợp gửi lại).
   */
  async createOtp(key: string, ttlSeconds = 300): Promise<string> {
    const otp = this.generateCode();
    // Pipeline để thực hiện atomic — tránh race condition
    await this.redis
      .pipeline()
      .set(`otp:${key}`, otp, 'EX', ttlSeconds)
      .del(`otp_fail:${key}`)   // reset fail counter khi OTP mới được tạo
      .del(`otp_lock:${key}`)   // xóa lock cũ nếu có
      .exec();
    return otp;
  }

  /**
   * Xác minh OTP người dùng nhập vào với bảo vệ brute-force.
   *
   * Luồng:
   * 1. Kiểm tra có đang bị lock không → 429 nếu có
   * 2. Lấy OTP đúng từ Redis
   * 3. Nếu sai → tăng fail counter → lock nếu đạt MAX_ATTEMPTS
   * 4. Nếu đúng → xóa OTP + fail counter → one-time use
   *
   * @throws TooManyRequestsException khi bị lockout
   * @returns true nếu OTP đúng, false nếu sai hoặc hết hạn
   */
  async verifyOtp(key: string, otp: string): Promise<boolean> {
    // Bước 1: Kiểm tra lock
    const locked = await this.redis.exists(`otp_lock:${key}`);
    if (locked) {
      const ttl = await this.redis.ttl(`otp_lock:${key}`);
      throw new HttpException(
        `Quá nhiều lần thử sai. Vui lòng thử lại sau ${ttl} giây.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Bước 2: Lấy OTP từ Redis
    const stored = await this.redis.get(`otp:${key}`);

    // OTP hết hạn hoặc không tồn tại
    if (!stored) return false;

    // Bước 3: OTP sai — tăng fail counter
    if (stored !== otp) {
      const fails = await this.redis.incr(`otp_fail:${key}`);
      // Set TTL cho fail counter bằng TTL của OTP để tự dọn dẹp
      await this.redis.expire(`otp_fail:${key}`, OtpService.LOCKOUT_SECONDS);

      if (fails >= OtpService.MAX_ATTEMPTS) {
        // Khóa key và xóa OTP — buộc người dùng phải request OTP mới
        await this.redis
          .pipeline()
          .set(`otp_lock:${key}`, '1', 'EX', OtpService.LOCKOUT_SECONDS)
          .del(`otp:${key}`)
          .del(`otp_fail:${key}`)
          .exec();
        throw new HttpException(
          `Quá nhiều lần thử sai. Vui lòng yêu cầu mã OTP mới sau ${OtpService.LOCKOUT_SECONDS / 60} phút.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return false;
    }

    // Bước 4: OTP đúng — xóa sạch, one-time use
    await this.redis
      .pipeline()
      .del(`otp:${key}`)
      .del(`otp_fail:${key}`)
      .exec();
    return true;
  }
}
