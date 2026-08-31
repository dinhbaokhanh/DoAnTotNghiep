import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator gắn metadata roles lên handler/class.
 * Dùng kết hợp với RolesGuard để kiểm tra quyền.
 *
 * Sử dụng:
 *   @Roles('admin', 'moderator')
 *   @UseGuards(GatewayAuthGuard, RolesGuard)
 *   createTag() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
