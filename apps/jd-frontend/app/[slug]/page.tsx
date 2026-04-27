import { getPageContentLayoutClass } from '@/lib/api/cms-page-layout';
import { getPageBySlug } from '@/lib/api/cms-pages';
import { CmsPageRichContent } from '../components/CmsPageRichContent';
import { renderSections } from '../components/sections/blockMap';
import { notFound } from 'next/navigation';

// Next.js requires a numeric literal here (cannot import REVALIDATE_SECONDS_CMS_PAGE). Keep in sync with cache-policy.ts.
export const revalidate = 60; // ISR + On-Demand

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found',
    };
  }

  if (page.seo) {
    return {
      title: page.seo.title,
      description: page.seo.description,
      keywords: page.seo.keywords,
      openGraph: {
        title: page.seo.ogTitle || page.seo.title,
        description: page.seo.ogDescription || page.seo.description,
        images: page.seo.ogImage ? [page.seo.ogImage.url] : [],
      },
    };
  }

  return {
    title: page.title,
    description: page.description ?? `${page.title} - Joydeem`,
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const hasSections = page.sections.length > 0;
  const contentHtml = page.content?.trim() ?? '';
  const hasContent = contentHtml.length > 0;

  if (!hasSections && !hasContent) {
    notFound();
  }

  return (
    <div className="grain-overlay">
      <main className="relative">
        {hasSections ? renderSections(page.sections) : null}
        {hasContent ? (
          <div className={getPageContentLayoutClass(page.layoutPreset)}>
            <h1 className="heading-2 text-ink mb-6">{page.title}</h1>
            <CmsPageRichContent html={contentHtml} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
