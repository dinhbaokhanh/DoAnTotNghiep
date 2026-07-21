import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

/**
 * Whitelist domain được phép làm avatarUrl.
 * Chặn SSRF (Server-Side Request Forgery): kẻ tấn công không thể
 * truyền vào URL nội bộ như http://redis:6379 hay http://localhost:8081
 * để gateway/service thực hiện request đến địa chỉ đó.
 *
 * Chỉ chấp nhận URL từ CDN hoặc media-service của hệ thống.
 * Khi deploy thật, thêm domain CDN thực vào danh sách này.
 */
const ALLOWED_AVATAR_HOSTS = [
  'res.cloudinary.com',   // Cloudinary CDN
  'storage.googleapis.com', // Google Cloud Storage
  'localhost',            // media-service local dev (port được validate bởi IsUrl)
  '127.0.0.1',            // media-service local dev
];

export class UpdateAvatarDto {
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    description: `URL ảnh đại diện. Chỉ chấp nhận từ domain: ${ALLOWED_AVATAR_HOSTS.join(', ')}`,
  })
  @IsUrl(
    {
      protocols: ['https', 'http'],
      require_protocol: true,
      host_whitelist: ALLOWED_AVATAR_HOSTS,
    },
    { message: `avatarUrl phải là URL hợp lệ từ CDN được cho phép` },
  )
  avatarUrl: string;
}
