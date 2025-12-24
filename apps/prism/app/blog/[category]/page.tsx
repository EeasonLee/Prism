import { PageContainer } from '@/app/components/PageContainer';
import {
  fetchArticleCategories,
  fetchArticleTags,
  fetchCategoryCounts,
  searchArticles,
  type CategoryDetail,
} from '@/lib/api/articles';
import { redirect } from 'next/navigation';
import { ArticleSearchBox } from '../components/ArticleSearchBox';
import { ArticlesSearchClient } from '../components/ArticlesSearchClient';
import { Breadcrumb } from '../components/Breadcrumb';
import type {
  ArticlesFilters,
  ArticlesSearchInitialData,
  CategoryWithCounts,
  TagOption,
} from '../types';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseNumber(value: string | string[] | undefined): number | undefined {
  if (!value) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseNumberArray(
  value: string | string[] | undefined
): number[] | undefined {
  if (!value) return undefined;
  const arr = Array.isArray(value) ? value : value.split(',');
  const parsed = arr
    .map(v => Number(v))
    .filter(n => Number.isFinite(n) && n > 0);
  return parsed.length ? parsed : undefined;
}

function parseSort(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === 'publishedAt:asc' || v === 'viewCount:desc') return v;
  return 'publishedAt:desc' as const;
}

function parseFilters(
  resolvedSearchParams: Record<string, string | string[] | undefined>,
  categorySlug: string
): ArticlesFilters {
  return {
    q: Array.isArray(resolvedSearchParams.q)
      ? resolvedSearchParams.q[0]
      : resolvedSearchParams.q,
    categoryId: parseNumber(resolvedSearchParams.categoryId),
    categoryLevel: parseNumber(resolvedSearchParams.categoryLevel) as
      | 1
      | 2
      | undefined,
    tagIds: parseNumberArray(resolvedSearchParams.tagIds),
    sort: parseSort(resolvedSearchParams.sort),
    locale: Array.isArray(resolvedSearchParams.locale)
      ? resolvedSearchParams.locale[0]
      : resolvedSearchParams.locale,
  };
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const categorySlug = resolvedParams.category;

  // 如果为空直接回博客首页
  if (!categorySlug) {
    redirect('/blog');
  }

  const page = Math.max(1, parseNumber(resolvedSearchParams.page) || 1);
  const pageSize = Math.max(
    1,
    parseNumber(resolvedSearchParams.pageSize) || 10
  );
  const filters = parseFilters(resolvedSearchParams, categorySlug);

  // 优先使用路由 category 作为默认分类（当未显式选择时）
  const effectiveCategorySlug =
    categorySlug === 'all' ? undefined : categorySlug;

  const [categoriesRes, countsRes, tagsRes, articlesRes] = await Promise.all([
    fetchArticleCategories({
      rootOnly: true,
      includeChildren: true,
      level: '1-2',
      locale: filters.locale,
    }),
    // 计数接口容错，后端 500 时仍允许页面渲染（计数置 0）
    fetchCategoryCounts({ locale: filters.locale }).catch(() => ({ data: [] })),
    fetchArticleTags({ locale: filters.locale }),
    searchArticles({
      page,
      pageSize,
      ...filters,
    }),
  ]);

  const categories = categoriesRes.data;
  const counts = countsRes.data;
  const tags = tagsRes.data;

  // 查找当前分类信息（用于面包屑）
  const findCategory = (
    list: CategoryWithCounts[],
    slug: string
  ): CategoryWithCounts | undefined => {
    for (const cat of list) {
      if (cat.slug === slug) return cat;
      if (cat.children) {
        const found = findCategory(cat.children as CategoryWithCounts[], slug);
        if (found) return found;
      }
    }
    return undefined;
  };

  const currentCategory =
    effectiveCategorySlug && effectiveCategorySlug !== 'all'
      ? findCategory(mergeCounts(categories, counts), effectiveCategorySlug)
      : undefined;

  const initialData: ArticlesSearchInitialData = {
    items: articlesRes.data,
    pagination: articlesRes.meta.pagination,
    degraded: articlesRes.meta.degraded,
  };

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
            ]}
          />
        </PageContainer>
      </div>

      {/* 搜索区域 */}
      <div className="bg-gradient-to-b from-white via-gray-50 to-white py-12 lg:py-16">
        <PageContainer>
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">
                Explore Great Content
              </h2>
              <p className="mt-3 text-lg text-gray-600">
                Search articles and keywords to discover more great content
              </p>
            </div>
            <ArticleSearchBox
              defaultValue={filters.q ?? ''}
              placeholder="Search articles, keywords..."
              suggestionLimit={8}
            />
          </div>
        </PageContainer>
      </div>

      <PageContainer fullWidth className="py-8">
        <ArticlesSearchClient
          initialCategorySlug={effectiveCategorySlug}
          categories={mergeCounts(categories, counts)}
          tags={tags as TagOption[]}
          initialFilters={filters}
          initialPage={page}
          initialPageSize={pageSize}
          initialData={initialData}
        />
      </PageContainer>
    </div>
  );
}

function mergeCounts(
  categories: CategoryDetail[],
  counts: CategoryDetail[]
): CategoryWithCounts[] {
  const countMap = new Map<number, CategoryDetail>();
  counts.forEach(c => countMap.set(c.id, c));

  const attach = (list: CategoryDetail[]): CategoryWithCounts[] =>
    list.map(cat => {
      const found = countMap.get(cat.id);
      // 计算包含子分类的文章数（articleCount + 所有子分类的 articleCount）
      const calculateChildrenCount = (
        children: CategoryDetail[] = []
      ): number => {
        return children.reduce((sum, child) => {
          const childFound = countMap.get(child.id);
          return sum + (childFound?.articleCount ?? child.articleCount ?? 0);
        }, 0);
      };

      const articleCount = found?.articleCount ?? cat.articleCount ?? 0;
      const childrenCount = calculateChildrenCount(cat.children);
      const articleCountWithChildren = articleCount + childrenCount;

      return {
        ...cat,
        parent: cat.parent, // 确保 parent 字段被保留
        articleCount,
        articleCountWithChildren,
        children: cat.children ? attach(cat.children) : [],
      } as CategoryWithCounts;
    });

  return attach(categories);
}
