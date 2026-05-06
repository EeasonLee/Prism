/**
 * BFF 代理客户端（同源请求 Next.js API routes）
 *
 * baseURL 为空字符串，所有请求发送到同源。
 * Cart/Auth 等客户端侧服务使用此客户端。
 */
import { createHttpClient } from '../pipeline/create-client';

export const bffClient = createHttpClient({
  baseURL: '',
  timeout: 15000,
});
