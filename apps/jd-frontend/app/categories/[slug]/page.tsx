import { notFound } from 'next/navigation';
import { resolveCategoryBySlug } from '@/features/category';
import { getPageBySlug, CategoryTemplate } from '@/features/cms-page';
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

  // 优先检查 CMS 页面（支持 /categories/xxx 映射到 CMS 的 category 模板页面）
  const cmsPage = await getPageBySlug(slug).catch(() => null);
  if (cmsPage && cmsPage.template === 'category') {
    return <CategoryTemplate sections={cmsPage.sections} />;
  }

  const category = await resolveCategoryBySlug(slug).catch(() => null);
  if (!category) {
    notFound();
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: category.name },
  ];

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
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
