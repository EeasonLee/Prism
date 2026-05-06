/**
 * API 配置工具函数
 *
 * 不存储具体环境变量值，只提供解析/校验工具。
 * 各客户端文件直接引用 env 并传入具体值。
 */

/**
 * 标准化 URL 基础路径：移除末尾斜杠
 */
export function normalizeBaseURL(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * 合并路径，处理首尾斜杠冲突
 */
export function joinURL(base: string, path: string): string {
  const cleanBase = normalizeBaseURL(base);
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}/${cleanPath}`;
}

/**
 * 判断当前是否服务端环境
 */
export function isServerSide(): boolean {
  return typeof (globalThis as { window?: unknown }).window === 'undefined';
}

/**
 * 判断当前是否开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
