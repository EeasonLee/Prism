/**
 * Cart BFF 统一处理器（服务端专用）
 *
 * 兼容层：新代码应直接使用 `@/lib/auth/requireAuth`。
 */

export { requireAuth as authenticatedCartRequest } from '@/lib/auth/requireAuth';
