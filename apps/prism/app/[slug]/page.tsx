import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/lib/api/cms-pages';
import { renderSections } from '../components/sections/blockMap';
import { getCategoryContextBySlug } from '../../lib/api/bff/category/list';
import { CategoryPageContent } from '../categories/components/CategoryPageContent';

// Next.js requires a numeric literal here (cannot import REVALIDATE_SECONDS_CMS_PAGE). Keep in sync with cache-policy.ts.
export const revalidate = 60; // ISR + On-Demand

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  // Try category first for best SEO
  const categoryData = await getCategoryContextBySlug(slug).catch(() => null);
  if (categoryData?.currentCategory) {
    const name = categoryData.currentCategory.name;
    return {
      title: `${name} - Shop - Joydeem`,
      description: `Shop ${name} at Joydeem. Browse our selection of quality products.`,
    };
  }

  // Fallback to CMS page
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

export default async function DynamicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  // 1. Try category first for flat SEO-friendly URLs like /{category-slug}
  const categoryData = await getCategoryContextBySlug(slug).catch(() => null);
  if (categoryData?.currentCategory) {
    return (
      <CategoryPageContent
        slug={slug}
        currentCategory={categoryData.currentCategory}
        categoryTree={categoryData.categoryTree}
        searchParams={sp}
      />
    );
  }

  // 2. Fallback to CMS page
  const page = await getPageBySlug(slug);
  if (!page || page.sections.length === 0) {
    notFound();
  }

  return (
    <div className="grain-overlay">
      <main className="relative">{renderSections(page.sections)}</main>
    </div>
  );
}
