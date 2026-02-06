import {
  fetchArticleCategories,
  fetchArticleTags,
  fetchCategoryCounts,
  searchArticles,
  type CategoryDetail,
} from '@/lib/api/articles'; // 使用应用层的导出，确保 API Client 已初始化
import type {
  ArticlesFilters,
  ArticlesSearchInitialData,
  CategoryWithCounts,
  TagOption,
} from '@prism/blog';
import { ArticleSearchBox } from '@prism/blog/components/ArticleSearchBox';
import { ArticlesSearchClient } from '@prism/blog/components/ArticlesSearchClient';
import { Breadcrumb } from '@prism/blog/components/Breadcrumb';
import { PageContainer } from '@prism/ui/components/PageContainer';
import { redirect } from 'next/navigation';

export const revalidate = 3600; // ISR 兜底 1 小时，主要依赖 On-Demand

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
  _categorySlug: string
): ArticlesFilters {
  // 解析 categoryIds（CSV 格式）
  const categoryIdsParam = Array.isArray(resolvedSearchParams.categoryIds)
    ? resolvedSearchParams.categoryIds[0]
    : resolvedSearchParams.categoryIds;
  const categoryIds = categoryIdsParam
    ? categoryIdsParam
        .split(',')
        .map(id => parseNumber(id))
        .filter((id): id is number => id !== undefined)
    : undefined;

  // 向后兼容：支持旧的 categoryId 参数
  const oldCategoryId = parseNumber(resolvedSearchParams.categoryId);

  let finalCategoryIds: number[] | undefined;
  if (categoryIds && categoryIds.length > 0) {
    // 新格式：categoryIds CSV
    finalCategoryIds = categoryIds;
  } else if (oldCategoryId) {
    // 向后兼容：旧的 categoryId 单个值
    finalCategoryIds = [oldCategoryId];
  }

  return {
    q: Array.isArray(resolvedSearchParams.q)
      ? resolvedSearchParams.q[0]
      : resolvedSearchParams.q,
    categoryIds: finalCategoryIds,
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

  // 先获取分类数据，以便根据 slug 查找分类 ID
  const [categoriesRes, countsRes, tagsRes] = await Promise.all([
    fetchArticleCategories({
      rootOnly: true,
      includeChildren: true,
      level: '1-2',
      locale: filters.locale,
    }),
    // 计数接口容错，后端 500 时仍允许页面渲染（计数置 0）
    fetchCategoryCounts({ locale: filters.locale }).catch(() => ({ data: [] })),
    fetchArticleTags({ locale: filters.locale }),
  ]);

  const categories = categoriesRes.data;
  const counts = countsRes.data;
  const tags = tagsRes.data;

  // 合并分类数据
  const mergedCategories = mergeCounts(categories, counts);

  // 查找当前分类信息（用于筛选和面包屑）
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

  // 如果 URL 中有分类 slug 但没有显式的 categoryId，则根据 slug 查找并设置
  const categoryFromSlug =
    effectiveCategorySlug && effectiveCategorySlug !== 'all'
      ? findCategory(mergedCategories, effectiveCategorySlug)
      : undefined;

  // 构建最终的筛选条件
  const finalFilters: ArticlesFilters = {
    ...filters,
    // 如果 URL 参数中没有 categoryIds，但路由中有分类 slug，则使用该分类
    categoryIds:
      filters.categoryIds && filters.categoryIds.length > 0
        ? filters.categoryIds
        : categoryFromSlug
        ? [categoryFromSlug.id]
        : undefined,
  };

  // 获取文章数据
  const articlesRes = await searchArticles({
    page,
    pageSize,
    ...finalFilters,
  });

  // 使用同一个函数查找分类（用于面包屑）
  const currentCategory =
    effectiveCategorySlug && effectiveCategorySlug !== 'all'
      ? findCategory(mergedCategories, effectiveCategorySlug)
      : undefined;

  const initialData: ArticlesSearchInitialData = {
    items: articlesRes.data,
    pagination: articlesRes.meta.pagination,
    degraded: articlesRes.meta.degraded,
  };

  // 构建面包屑项
  const breadcrumbItems = [{ label: 'Blog', href: '/blog' }];
  if (categorySlug === 'all') {
    // 当路由是 /blog/all 时，显示 "Blog > All"
    breadcrumbItems.push({ label: 'All', href: '/blog/all' });
  } else if (currentCategory) {
    // 当有具体分类时，显示分类名称
    breadcrumbItems.push({
      label: currentCategory.name,
      href: `/blog/${currentCategory.slug}`,
    });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <PageContainer className="py-4">
          <Breadcrumb items={breadcrumbItems} />
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

      <ArticlesSearchClient
        initialCategorySlug={effectiveCategorySlug}
        categories={mergedCategories}
        tags={tags as TagOption[]}
        initialFilters={finalFilters}
        initialPage={page}
        initialPageSize={pageSize}
        initialData={initialData}
      />
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
