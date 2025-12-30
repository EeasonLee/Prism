/**
 * 判断是否在服务端运行
 */
export function isServerSide(): boolean {
  return typeof (globalThis as { window?: unknown }).window === 'undefined';
}
