/**
 * HTML 文本处理工具（纯函数）
 */

/**
 * 去除 HTML 标签并解码常见实体，返回纯文本。
 * 适用场景：将富文本摘要转为纯文本展示（如卡片子标题、卖点提取）。
 */
export function stripHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
