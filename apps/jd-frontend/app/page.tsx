import { getPageBySlug } from '@/features/cms-page/cms-pages.api';
import { renderSections } from '@/features/cms-page/blockMap';

// Next.js requires a numeric literal here (cannot import REVALIDATE_SECONDS_CMS_PAGE). Keep in sync with cache-policy.ts.
export const revalidate = 60; // ISR + On-Demand

export async function generateMetadata() {
  const page = await getPageBySlug('home');

  if (!page || !page.seo) {
    return {
      title: 'Joydeem - Smart Kitchen Appliances',
      description: 'Discover innovative kitchen appliances for modern living',
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

export default async function Page() {
  const page = await getPageBySlug('home');
  const sections = page?.sections ?? [];

  return (
    <div className="grain-overlay">
      <main className="relative">{renderSections(sections)}</main>
    </div>
  );
}
