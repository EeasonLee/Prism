export interface HtmlSection {
  title: string;
  contentHtml: string;
}

const HEADING_PATTERN = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, '');
}

function decodeCommonEntities(value: string): string {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function normalizeText(value: string): string {
  return decodeCommonEntities(stripTags(value)).replace(/\s+/g, ' ').trim();
}

/** 解析 HTML 富文本字符串，按 `<h1>` 标签切分为可折叠区块列表 */
export function parseHtmlIntoSections(html: unknown): HtmlSection[] {
  if (typeof html !== 'string') return [];
  const source = html.trim();
  if (!source) return [];

  const headings = Array.from(source.matchAll(HEADING_PATTERN));
  if (headings.length === 0) return [];

  return headings
    .map((heading, index) => {
      const headingMarkup = heading[1] ?? '';
      const title = normalizeText(headingMarkup);
      if (!title) return null;

      const start = (heading.index ?? 0) + heading[0].length;
      const end =
        index + 1 < headings.length
          ? headings[index + 1].index ?? source.length
          : source.length;
      const contentHtml = source.slice(start, end).trim();
      const contentText = normalizeText(contentHtml);

      return {
        title,
        contentHtml: contentText ? contentHtml : '<p></p>',
      };
    })
    .filter((section): section is HtmlSection => section != null);
}
