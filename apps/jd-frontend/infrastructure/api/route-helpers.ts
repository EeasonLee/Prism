/**
 * Route handler 错误处理工具
 *
 * 替代所有 route handler 中手写的 `NextResponse.json({ error }, { status: 502 })`。
 */

import { NextResponse } from 'next/server';
import { ApiError } from './errors';

/**
 * 统一 API 路由错误响应
 *
 * 用法：
 *   try { ... } catch (error) { return handleApiError(error) }
 */
export function handleApiError(
  error: unknown
): NextResponse<{ error: string; detail?: unknown }> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.data !== undefined ? { detail: error.data } : {}),
      },
      { status: error.status }
    );
  }

  const message =
    error instanceof Error ? error.message : 'Internal server error';

  // 保留 502 作为 Magento/后端不可用的默认状态
  return NextResponse.json({ error: message }, { status: 502 });
}
