/**
 * 客户端安全的 unified-product 工具函数
 *
 * 与 unified-product.ts 分离，避免客户端组件通过值导入拉入 server-side 依赖链
 * （catalog.ts → sso.ts → env.MAGENTO_URL）。
 */

export function normalizeCpPrice(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number.parseFloat(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  return null;
}
