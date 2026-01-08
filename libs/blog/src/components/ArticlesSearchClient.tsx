'use client';

import { OptimizedImage } from '@prism/ui/components/OptimizedImage';
import { PageContainer } from '@prism/ui/components/PageContainer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@prism/ui/components/accordion';
import { Button } from '@prism/ui/components/button';
import { Checkbox } from '@prism/ui/components/checkbox';
import { Loader } from '@prism/ui/components/loader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@prism/ui/components/select';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { searchArticles } from '../api/queries';
import type {
  ArticleItem,
  ArticlesFilters,
  ArticleSort,
  ArticlesSearchInitialData,
  CategoryWithCounts,
  TagOption,
} from '../api/types';

type Props = {
  initialCategorySlug?: string;
  categories: CategoryWithCounts[];
  tags: TagOption[];
  initialFilters: ArticlesFilters;
  initialPage: number;
  initialPageSize: number;
  initialData: ArticlesSearchInitialData;
};

const SORT_OPTIONS: { value: ArticleSort; label: string }[] = [
  { value: 'publishedAt:desc', label: 'Latest' },
  { value: 'publishedAt:asc', label: 'Oldest' },
  { value: 'viewCount:desc', label: 'Most Popular' },
];

// 格式化数字，使用固定 locale 避免 hydration 不匹配
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function ArticlesSearchClient({
  initialCategorySlug,
  categories,
  tags,
  initialFilters,
  initialPage,
  initialPageSize,
  initialData,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ArticlesFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [items, setItems] = useState<ArticleItem[]>(initialData.items);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const categorySlugToSelection = useMemo(() => {
    if (!initialCategorySlug) return null;
    const found = findCategoryBySlug(categories, initialCategorySlug);
    if (!found) return null;
    // 判断分类级别：如果有 parent 且 parent 不为 null，则是二级分类；否则是一级分类
    // 与服务端的逻辑保持一致
    const level = found.parent && found.parent !== null ? 2 : 1;
    return { categoryId: found.id, categoryLevel: level as 1 | 2 };
  }, [categories, initialCategorySlug]);

  useEffect(() => {
    // 如果 URL 未显式指定分类且路由带 slug，则用它初始化并更新 URL
    if (!filters.categoryId && categorySlugToSelection) {
      const nextFilters = {
        ...filters,
        ...categorySlugToSelection,
      };
      setFilters(nextFilters);
      // 更新 URL 以保持同步
      updateUrl(nextFilters, page, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlugToSelection]);

  const updateUrl = useCallback(
    (next: ArticlesFilters, nextPage: number, nextPageSize: number) => {
      const qs = new URLSearchParams();
      if (next.q) qs.set('q', next.q);
      if (next.categoryId) {
        qs.set('categoryId', String(next.categoryId));
      }
      if (next.categoryLevel) {
        qs.set('categoryLevel', String(next.categoryLevel));
      }
      if (next.tagIds && next.tagIds.length) {
        qs.set('tagIds', next.tagIds.join(','));
      }
      if (next.locale) qs.set('locale', next.locale);
      qs.set('sort', next.sort);
      qs.set('page', String(nextPage));
      qs.set('pageSize', String(nextPageSize));

      // 根据 categoryId 查找对应的分类 slug
      let targetSlug = 'all';
      if (next.categoryId) {
        const findCategoryById = (
          list: CategoryWithCounts[],
          id: number
        ): CategoryWithCounts | undefined => {
          for (const cat of list) {
            if (cat.id === id) return cat;
            if (cat.children) {
              const found = findCategoryById(
                cat.children as CategoryWithCounts[],
                id
              );
              if (found) return found;
            }
          }
          return undefined;
        };
        const selectedCategory = findCategoryById(categories, next.categoryId);
        if (selectedCategory) {
          targetSlug = selectedCategory.slug;
        } else {
          // 如果找不到分类，使用 initialCategorySlug 作为后备
          targetSlug = initialCategorySlug ?? 'all';
        }
      }

      router.replace(`/blog/${targetSlug}?${qs.toString()}`, {
        scroll: false,
      });
    },
    [router, initialCategorySlug, categories]
  );

  const fetchList = useCallback(
    async (
      nextFilters: ArticlesFilters,
      nextPage: number,
      nextPageSize: number
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setError(null);
      try {
        const res = await searchArticles({
          ...nextFilters,
          page: nextPage,
          pageSize: nextPageSize,
          signal: controller.signal,
        } as Parameters<typeof searchArticles>[0]); // satisfy type
        setItems(res.data);
        setPagination(res.meta.pagination);
        updateUrl(nextFilters, nextPage, nextPageSize);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message || 'Failed to load articles');
      } finally {
        setIsLoading(false);
      }
    },
    [updateUrl]
  );

  // 当 URL 变化（例如浏览器前进/后退）时同步状态
  useEffect(() => {
    const qsFilters = parseFiltersFromSearchParams(searchParams, filters.sort);

    // 如果 URL 中没有 categoryId，但路由中有 initialCategorySlug 且 URL 路由不是 'all'
    // 则保留初始筛选条件（从特定分类路由进来时自动选中该分类）
    // 如果 URL 路由已经是 'all'，则不再自动恢复分类筛选（用户已清除筛选）
    const currentPath = window.location.pathname;
    const isAllRoute =
      currentPath === '/blog/all' || currentPath.endsWith('/all');

    if (!qsFilters.categoryId && categorySlugToSelection && !isAllRoute) {
      qsFilters.categoryId = categorySlugToSelection.categoryId;
      qsFilters.categoryLevel = categorySlugToSelection.categoryLevel;
    } else if (
      !qsFilters.categoryId &&
      initialFilters.categoryId &&
      !isAllRoute
    ) {
      // 如果 URL 中没有 categoryId，但 initialFilters 中有，也保留它
      qsFilters.categoryId = initialFilters.categoryId;
      qsFilters.categoryLevel = initialFilters.categoryLevel;
    }

    setFilters(qsFilters);
    setPage(Number(searchParams.get('page')) || 1);
    setPageSize(Number(searchParams.get('pageSize')) || pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categorySlugToSelection]);

  const handleTagToggle = (id: number, checked: boolean) => {
    const current = filters.tagIds ?? [];
    const nextIds = checked
      ? Array.from(new Set([...current, id]))
      : current.filter(t => t !== id);
    const next = { ...filters, tagIds: nextIds };
    setFilters(next);
    setPage(1);
    fetchList(next, 1, pageSize);
  };

  const handleCategorySelect = (cat: CategoryWithCounts, isChild: boolean) => {
    const next = {
      ...filters,
      categoryId: cat.id,
      categoryLevel: (isChild ? 2 : 1) as 1 | 2,
    };
    setFilters(next);
    setPage(1);
    fetchList(next, 1, pageSize);
  };

  const handleSortChange = (value: ArticleSort) => {
    const next = { ...filters, sort: value };
    setFilters(next);
    fetchList(next, 1, pageSize);
    setPage(1);
  };

  const handlePageChange = (target: number) => {
    setPage(target);
    fetchList(filters, target, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    const nextSize = Math.max(1, size);
    setPageSize(nextSize);
    fetchList(filters, 1, nextSize);
    setPage(1);
  };

  const clearFilters = () => {
    const next: ArticlesFilters = { sort: 'publishedAt:desc' };
    setFilters(next);
    setPage(1);
    setPageSize(10);
    // fetchList 内部的 updateUrl 会自动处理 URL 跳转到 /blog/all
    fetchList(next, 1, 10);
  };

  return (
    <PageContainer fullWidth className="py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-80 lg:flex-shrink-0">
          <FiltersPanel
            categories={categories}
            tags={tags}
            selectedCategoryId={filters.categoryId}
            selectedCategoryLevel={filters.categoryLevel}
            selectedTagIds={filters.tagIds ?? []}
            onCategorySelect={handleCategorySelect}
            onTagToggle={handleTagToggle}
            onClear={clearFilters}
          />
        </aside>

        <main className="min-w-0 flex-1">
          {/* Header with Articles count and Sort by */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatNumber(pagination.total)} Articles
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Showing {formatNumber(items.length)} of{' '}
                {formatNumber(pagination.total)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sort by</span>
              <Select
                value={filters.sort}
                onValueChange={val => handleSortChange(val as ArticleSort)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="relative">
            {isLoading && (
              <div className="pointer-events-auto absolute inset-0 z-10 flex items-start justify-center bg-white/60 backdrop-blur-[2px] pt-6">
                <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 shadow-sm">
                  <Loader size="sm" className="text-gray-700" />
                  <span className="text-sm text-gray-700">
                    Loading articles...
                  </span>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-600">No articles found</p>
              </div>
            ) : (
              <>
                <ArticleGrid articles={items} />
                {pagination && (
                  <div className="mt-8">
                    <Pagination
                      page={pagination.page}
                      pageCount={pagination.pageCount}
                      onPageChange={handlePageChange}
                      pageSize={pagination.pageSize}
                      onPageSizeChange={handlePageSizeChange}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </PageContainer>
  );
}

function FiltersPanel({
  categories,
  tags,
  selectedCategoryId,
  selectedCategoryLevel: _selectedCategoryLevel,
  selectedTagIds,
  onCategorySelect,
  onTagToggle,
  onClear,
}: {
  categories: CategoryWithCounts[];
  tags: TagOption[];
  selectedCategoryId?: number;
  selectedCategoryLevel?: 1 | 2;
  selectedTagIds: number[];
  onCategorySelect: (cat: CategoryWithCounts, isChild: boolean) => void;
  onTagToggle: (id: number, checked: boolean) => void;
  onClear: () => void;
}) {
  // 从当前路径获取分类 slug（用于判断二级分类是否应该高亮）
  const pathname = usePathname();
  const currentCategorySlug = useMemo(() => {
    // 路径格式：/blog/[category]
    const match = pathname.match(/^\/blog\/([^/]+)$/);
    if (match && match[1] && match[1] !== 'all') {
      return match[1];
    }
    return undefined;
  }, [pathname]);
  // 构建已选筛选项的 chips
  const chips: Array<{
    type: 'category' | 'tag';
    id: number;
    label: string;
  }> = [];

  // 添加已选分类
  if (selectedCategoryId) {
    const findCategory = (
      list: CategoryWithCounts[],
      id: number
    ): CategoryWithCounts | undefined => {
      for (const cat of list) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findCategory(cat.children as CategoryWithCounts[], id);
          if (found) return found;
        }
      }
      return undefined;
    };
    const selectedCat = findCategory(categories, selectedCategoryId);
    if (selectedCat) {
      chips.push({
        type: 'category',
        id: selectedCat.id,
        label: selectedCat.name,
      });
    }
  }

  // 添加已选标签
  selectedTagIds.forEach(tagId => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      chips.push({ type: 'tag', id: tag.id, label: tag.name });
    }
  });

  const hasActiveFilters = chips.length > 0;

  // 默认展开有内容的区域
  const defaultOpenValues = [];
  // 默认展开所有一级分类的 Accordion
  const rootCategories = categories.filter(
    cat => cat.parent === null || cat.parent === undefined
  );
  rootCategories.forEach(cat => {
    defaultOpenValues.push(`category-${cat.id}`);
  });
  if (tags.length > 0) defaultOpenValues.push('tags');

  return (
    <div className="sticky top-8">
      <h2 className="mb-4 text-3xl font-bold text-gray-800">Filters</h2>

      {/* 当前勾选的筛选项 */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {chips.map(chip => (
            <button
              key={`${chip.type}-${chip.id}`}
              type="button"
              onClick={() => {
                if (chip.type === 'category') {
                  onCategorySelect(
                    { id: chip.id } as CategoryWithCounts,
                    false
                  );
                } else {
                  onTagToggle(chip.id, false);
                }
              }}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span>{chip.label}</span>
              <span className="text-gray-400">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            Clear All
          </button>
        </div>
      )}

      <Accordion
        type="multiple"
        defaultValue={defaultOpenValues}
        className="space-y-2"
      >
        {/* Categories Section - 每个一级分类作为一个 Accordion */}
        {categories
          .filter(cat => {
            // 只显示一级分类：parent 为 null 或 undefined
            // 根据 API 数据结构，一级分类的 parent 字段为 null
            return cat.parent === null || cat.parent === undefined;
          })
          .map(category => (
            <AccordionItem
              key={category.id}
              value={`category-${category.id}`}
              className="rounded-md border border-gray-200 bg-white px-4"
            >
              <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline">
                {category.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-4 space-y-2">
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                    {category.children && category.children.length > 0 ? (
                      category.children.map(child => {
                        // 高亮判断逻辑：
                        // 1. 如果 selectedCategoryId 存在且匹配，且是二级分类（selectedCategoryLevel === 2），则高亮（立即反馈）
                        // 2. 如果 selectedCategoryId 不存在或不匹配，且当前路由的 slug 匹配二级分类的 slug，则高亮（从 URL 初始化）
                        // 只高亮二级分类（确保不会高亮一级分类）
                        const isSelectedById =
                          selectedCategoryId === child.id &&
                          _selectedCategoryLevel === 2;
                        const isSelectedBySlug =
                          currentCategorySlug &&
                          currentCategorySlug !== 'all' &&
                          child.slug === currentCategorySlug &&
                          // 如果 selectedCategoryId 存在但不匹配当前 child，不使用 slug 判断（避免旧分类高亮）
                          (selectedCategoryId === undefined ||
                            selectedCategoryId === child.id);
                        const childSelected =
                          isSelectedById || isSelectedBySlug;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() =>
                              onCategorySelect(
                                child as CategoryWithCounts,
                                true
                              )
                            }
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                              childSelected
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <span>{child.name}</span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">No subcategories</p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}

        {/* Tags Section */}
        {tags.length > 0 && (
          <AccordionItem
            value="tags"
            className="rounded-md border border-gray-200 bg-white px-4"
          >
            <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline">
              Tags
            </AccordionTrigger>
            <AccordionContent>
              <div className="mt-4 space-y-2">
                <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
                  {tags.map(tag => (
                    <label
                      key={tag.id}
                      className="flex cursor-pointer items-start gap-2 py-1"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <Checkbox
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={checked =>
                            onTagToggle(tag.id, checked === true)
                          }
                        />
                      </div>
                      <span className="flex-1 text-sm text-gray-700 leading-relaxed">
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

function ArticleGrid({ articles }: { articles: ArticleItem[] }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-gray-600">No articles found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

function ArticleCard({ article }: { article: ArticleItem }) {
  const cleanTitle = article.title.replace(/<[^>]+>/g, '');
  const imageAlt = cleanTitle || 'Article image';

  // Get the first category as display category
  const category = article.categories?.[0]?.name || 'ARTICLE';
  const categorySlug = article.categories?.[0]?.slug || 'all';

  return (
    <Link
      href={`/blog/${categorySlug}/${article.slug}`}
      className="group relative block overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-lg"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100">
        <OptimizedImage
          src={article.featuredImage}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}
        />
      </div>

      {/* Content area */}
      <div className="p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {category}
        </p>
        <h3 className="text-base font-semibold leading-tight text-gray-900">
          <span dangerouslySetInnerHTML={{ __html: article.title }} />
        </h3>
        {article.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            <span dangerouslySetInnerHTML={{ __html: article.excerpt }} />
          </p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span>
            {new Date(article.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {article.viewCount !== undefined && (
            <span>{formatNumber(article.viewCount)} views</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  pageSize,
  onPageSizeChange,
  isLoading,
}: {
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
  pageSize: number;
  onPageSizeChange: (s: number) => void;
  isLoading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Per page</span>
        <select
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          disabled={isLoading}
        >
          {[5, 10, 20, 30, 50].map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-700">
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function findCategoryBySlug<T extends { slug: string; children?: T[] }>(
  list: T[],
  slug: string
): T | undefined {
  for (const cat of list) {
    if (cat.slug === slug) return cat;
    if (cat.children) {
      const found = findCategoryBySlug(cat.children, slug);
      if (found) return found;
    }
  }
  return undefined;
}

function parseFiltersFromSearchParams(
  sp: ReturnType<typeof useSearchParams>,
  fallbackSort: ArticleSort
) {
  const tagIds = sp.get('tagIds');
  return {
    q: sp.get('q') || undefined,
    categoryId: sp.get('categoryId') ? Number(sp.get('categoryId')) : undefined,
    categoryLevel: sp.get('categoryLevel')
      ? (Number(sp.get('categoryLevel')) as 1 | 2)
      : undefined,
    tagIds: tagIds
      ? tagIds
          .split(',')
          .map(id => Number(id))
          .filter(Boolean)
      : undefined,
    sort: (sp.get('sort') as ArticleSort) || fallbackSort,
    locale: sp.get('locale') || undefined,
  } satisfies ArticlesFilters;
}
