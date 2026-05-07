import { notFound } from 'next/navigation';
import { resolveCategoryBySlug } from '@/features/category';
import { buildBreadcrumbSchema } from '@/shared/utils/seo';
import { type BreadcrumbItem } from '@/app/_ui/Breadcrumb';
import { CategoryPageContent } from './CategoryPageContent';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await resolveCategoryBySlug(slug).catch(() => null);
  if (!category) {
    notFound();
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: category.name },
  ];

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: category.name, path: `/categories/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CategoryPageContent
        currentCategory={category}
        searchParams={sp}
        breadcrumbItems={breadcrumbItems}
      />
    </>
  );
}
