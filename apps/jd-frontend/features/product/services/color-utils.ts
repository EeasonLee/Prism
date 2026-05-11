/**
 * 颜色工具
 *
 * 运营后台配置的标签颜色为 #RRGGBB 格式，需计算合适的前景色以保证可读性。
 * 参考 WCAG 2.0 相对亮度定义。
 */

/** 根据背景色计算前景文字色（black 或 white），保证 WCAG 对比度 */
export function contrastForegroundForBackground(
  background: string
): 'black' | 'white' {
  const raw = background.trim().replace('#', '');
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw;
  const match = /^([0-9a-fA-F]{6})$/.exec(expanded);
  if (!match) return 'white';

  const n = parseInt(match[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;

  const [rs, gs, bs] = [r, g, b].map(c => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });

  const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  return luminance > 0.45 ? 'black' : 'white';
}
