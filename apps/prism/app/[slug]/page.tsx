import { getPageBySlug } from '@/lib/api/cms-pages';
import { renderSections } from '../components/sections/blockMap';
import { notFound } from 'next/navigation';

export const revalidate = 60; // ISR 60s 缓存

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page || !page.seo) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found',
    };
  }

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

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  // 如果页面不存在或没有 sections，返回 404
  if (!page || page.sections.length === 0) {
    notFound();
  }

  return (
    <div className="grain-overlay">
      <main className="relative">{renderSections(page.sections)}</main>
    </div>
  );
}
