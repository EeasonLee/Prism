import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/app/components/PageContainer';
import { fetchArticleBySlug, fetchArticleCategories } from '@/lib/api/articles';
import { Breadcrumb } from '../../components/Breadcrumb';
import { ArticleDetail } from '../../components/ArticleDetail';

type ArticleDetailPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 3600; // ISR: 重新验证时间 1 小时

export default async function ArticleDetailPage({
  params,
  searchParams,
}: ArticleDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { category, slug } = resolvedParams;

  if (!slug) {
    notFound();
  }

  // 获取 locale（如果有，默认为 'en'）
  const locale = Array.isArray(resolvedSearchParams.locale)
    ? resolvedSearchParams.locale[0]
    : resolvedSearchParams.locale || 'en';

  try {
    // 在服务端获取文章数据
    const { data: article } = await fetchArticleBySlug(slug, locale);

    // 验证 URL 中的 category 是否与文章的实际分类匹配
    const actualCategorySlug = article.categories?.[0]?.slug;
    if (actualCategorySlug && category !== actualCategorySlug) {
      // 重定向到正确的路由（服务端重定向）
      redirect(`/blog/${actualCategorySlug}/${slug}`);
    }

    // 获取分类信息（用于面包屑）
    const categoriesRes = await fetchArticleCategories({
      rootOnly: true,
      includeChildren: true,
      level: '1-2',
      locale,
    });
    const categories = categoriesRes.data;

    // 查找当前分类信息（用于面包屑）
    const findCategory = (
      list: typeof categories,
      slug: string
    ): (typeof categories)[0] | undefined => {
      for (const cat of list) {
        if (cat.slug === slug) return cat;
        if (cat.children) {
          const found = findCategory(cat.children, slug);
          if (found) return found;
        }
      }
      return undefined;
    };

    const currentCategory = actualCategorySlug
      ? findCategory(categories, actualCategorySlug)
      : undefined;

    return (
      <div className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <div className="border-b border-gray-200 bg-white">
          <PageContainer className="py-4">
            <Breadcrumb
              items={[
                { label: 'Blog', href: '/blog' },
                ...(currentCategory
                  ? [
                      {
                        label: currentCategory.name,
                        href: `/blog/${currentCategory.slug}`,
                      },
                    ]
                  : []),
                { label: article.title, href: '#' },
              ]}
            />
          </PageContainer>
        </div>

        <PageContainer className="py-8">
          <ArticleDetail article={article} />
        </PageContainer>
      </div>
    );
  } catch (error) {
    // 处理错误
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 如果是 404 错误，显示 404 页面
    if (
      errorMessage.includes('404') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('Article not found') ||
      errorMessage.includes('NOT_FOUND')
    ) {
      notFound();
    }

    // 其他错误抛出，由 error.tsx 处理
    throw error;
  }
}
