/**
 * CMS Page 富文本正文（Strapi richtext HTML），与站内商品详情等 prose 风格对齐。
 */
export function CmsPageRichContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-ink-muted [&_a]:text-ink [&_a]:underline hover:[&_a]:text-brand [&_strong]:font-semibold [&_strong]:text-ink"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
