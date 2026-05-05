import { fetchArticleBySlug } from '@/features/product/blog-bridge.api'; // 使用应用层的导出，确保 API Client 已初始化
import {
  buildArticleMetadata,
  buildArticleSchema,
  buildBreadcrumbSchema,
} from '@/shared/utils/seo';
import type { Metadata } from 'next';
import { cache } from 'react';
import { ArticleDetail } from '@prism/blog/components/ArticleDetail';
import { ArticleSidebar } from '@prism/blog/components/ArticleSidebar';
import { Breadcrumb } from '@prism/blog/components/Breadcrumb';
import { PageContainer } from '@prism/ui/components/PageContainer';
import { notFound, redirect } from 'next/navigation';

type ArticleDetailPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Numeric literal required by Next.js segment config; sync with REVALIDATE_SECONDS_CMS_ASSOCIATION in cache-policy.ts
export const revalidate = 3600; // ISR 兜底，主要依赖 On-Demand

const getArticleDetail = cache(async (slug: string, locale: string) => {
  const { data: article } = await fetchArticleBySlug(slug, locale);
  return article;
});

export async function generateMetadata({
  params,
  searchParams,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const locale = Array.isArray(resolvedSearchParams.locale)
    ? resolvedSearchParams.locale[0]
    : resolvedSearchParams.locale || 'en';

  try {
    const article = await getArticleDetail(slug, locale);
    return buildArticleMetadata(article, category);
  } catch {
    return {
      title: 'Article Not Found | Joydeem Blog',
      description:
        'Read kitchen insights, product guides, and cooking inspiration from Joydeem.',
      alternates: { canonical: `/blog/${category}/${slug}` },
    };
  }
}

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
    const article = await getArticleDetail(slug, locale);

    // 验证 URL 中的 category 是否与文章的实际分类匹配
    const primaryCategory = article.categories?.[0];
    const actualCategorySlug = primaryCategory?.slug;
    if (actualCategorySlug && category !== actualCategorySlug) {
      // 重定向到正确的路由（服务端重定向）
      redirect(`/blog/${actualCategorySlug}/${slug}`);
    }

    // 检查是否有侧边栏内容
    const hasProducts = article.products && article.products.length > 0;
    const hasRelatedArticles =
      article.relatedArticles &&
      Array.isArray(article.relatedArticles) &&
      article.relatedArticles.length > 0;
    const hasSidebarContent = hasProducts || hasRelatedArticles;
    const canonicalCategory = actualCategorySlug ?? category;
    const breadcrumbSource = [
      { name: 'Blog', path: '/blog' },
      ...(primaryCategory
        ? [
            {
              name: primaryCategory.name,
              path: `/blog/${primaryCategory.slug}`,
            },
          ]
        : []),
      {
        name: article.title,
        path: `/blog/${canonicalCategory}/${slug}`,
      },
    ];
    const breadcrumbItems = breadcrumbSource.map((item, index) => ({
      label: item.name,
      href: index === breadcrumbSource.length - 1 ? '#' : item.path,
    }));
    const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbSource);
    const articleSchema = buildArticleSchema(article, canonicalCategory);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([breadcrumbSchema, articleSchema]),
          }}
        />
        <div className="min-h-screen bg-white">
          {/* Breadcrumb */}
          <div className="border-b border-gray-200 bg-white">
            <PageContainer className="py-4">
              <Breadcrumb items={breadcrumbItems} />
            </PageContainer>
          </div>

          <PageContainer className="py-8">
            <div
              className={
                hasSidebarContent
                  ? 'grid gap-8 lg:grid-cols-[1fr,360px]'
                  : 'w-full'
              }
            >
              {/* 文章内容：min-w-0 + overflow-x-hidden 防止 CMS 正文撑出视口 */}
              <div className="min-w-0 overflow-x-hidden">
                <ArticleDetail article={article} />
              </div>

              {/* 右侧固定栏 - 桌面显示 */}
              {hasSidebarContent && (
                <div className="hidden lg:block">
                  <ArticleSidebar article={article} />
                </div>
              )}
            </div>
            {/* 移动端：Related Products / Related Articles 在正文下方单列展示（始终渲染区块，由 ArticleSidebar 内部判断是否有内容） */}
            <div className="mt-8 block w-full lg:hidden">
              <ArticleSidebar article={article} />
            </div>
          </PageContainer>
        </div>
      </>
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
