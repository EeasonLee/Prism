import { apiClient } from './client';
import { isServerSide } from './config';

export type ArticleSort =
  | 'publishedAt:desc'
  | 'publishedAt:asc'
  | 'viewCount:desc';

export interface ArticleCategory {
  id: number;
  name: string;
  slug: string;
  level: number;
  articleCount: number;
  articleCountWithChildren: number;
  children?: ArticleCategory[];
}

export interface ArticleTag {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleListItem {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  featuredImage: string | null;
  publishedAt: string;
  viewCount: number;
  locale?: string;
}

export interface ArticleSearchResponse {
  data: Array<
    ArticleListItem & {
      // 高亮字段为 HTML，后端已包裹 <mark>
      title: string;
      excerpt: string;
    }
  >;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
    query?: string;
    took?: number;
    source?: string;
    degraded?: boolean;
  };
}

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        qs.append(key, value.join(','));
      }
    } else {
      qs.append(key, String(value));
    }
  });
  return qs.toString();
}

export async function searchArticles(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  categoryId?: number;
  categoryLevel?: 1 | 2;
  tagIds?: number[];
  sort?: ArticleSort;
  locale?: string;
  signal?: AbortSignal;
}): Promise<ArticleSearchResponse> {
  const queryString = buildQuery({
    q: params.q,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    categoryId: params.categoryId,
    categoryLevel: params.categoryLevel,
    tagIds:
      params.tagIds && params.tagIds.length > 0 ? params.tagIds : undefined,
    sort: params.sort ?? 'publishedAt:desc',
    locale: params.locale,
  });
  return apiClient.get<ArticleSearchResponse>(
    `api/articles/search?${queryString}`,
    {
      signal: params.signal,
    }
  );
}

export async function fetchArticleCategories(params?: {
  rootOnly?: boolean;
  includeChildren?: boolean;
  level?: string;
  locale?: string;
}): Promise<{ data: CategoryDetail[] }> {
  // 直接使用 /api/categories，不添加任何查询参数
  const endpoint = `api/categories`;
  const options = isServerSide()
    ? ({ next: { revalidate: 60 } } as const)
    : undefined;
  return apiClient.get<{ data: CategoryDetail[] }>(endpoint, options);
}

export async function fetchCategoryCounts(params?: {
  locale?: string;
}): Promise<{ data: CategoryDetail[] }> {
  const queryString = buildQuery({ locale: params?.locale });
  const endpoint = `api/categories/article-counts${
    queryString ? `?${queryString}` : ''
  }`;
  const options = isServerSide()
    ? ({ next: { revalidate: 60 } } as const)
    : undefined;
  return apiClient.get<{ data: CategoryDetail[] }>(endpoint, options);
}

export async function fetchArticleTags(params?: {
  locale?: string;
}): Promise<{ data: ArticleTag[] }> {
  const queryString = buildQuery({ locale: params?.locale });
  const endpoint = `api/tags${queryString ? `?${queryString}` : ''}`;
  const options = isServerSide()
    ? ({ next: { revalidate: 300 } } as const)
    : undefined;
  return apiClient.get<{ data: ArticleTag[] }>(endpoint, options);
}

// 分类详情（包含 icon 等完整信息）
export interface CategoryArticle {
  id: number;
  documentId: string;
  title: string;
  excerpt: string | null;
  slug: string;
  viewCount: number;
  featuredImage: {
    id: number;
    url: string;
    alternativeText: string | null;
    formats?: {
      small?: { url: string };
      medium?: { url: string };
      thumbnail?: { url: string };
    };
  } | null;
}

export interface CategoryIcon {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats?: {
    small?: {
      ext: string;
      url: string;
      hash: string;
      mime: string;
      name: string;
      path: string | null;
      size: number;
      width: number;
      height: number;
      sizeInBytes: number;
    };
    medium?: {
      ext: string;
      url: string;
      hash: string;
      mime: string;
      name: string;
      path: string | null;
      size: number;
      width: number;
      height: number;
      sizeInBytes: number;
    };
    thumbnail?: {
      ext: string;
      url: string;
      hash: string;
      mime: string;
      name: string;
      path: string | null;
      size: number;
      width: number;
      height: number;
      sizeInBytes: number;
    };
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: unknown | null;
  folderPath: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string | null;
}

export interface CategoryDetail {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  path: string | null;
  sortOrder: number;
  isActive: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string | null;
  parent: CategoryDetail | null;
  icon: CategoryIcon | null;
  seo: unknown | null;
  articleCount: number;
  childrenCount: number;
  children?: CategoryDetail[];
  articles?: CategoryArticle[];
}

export interface CategoryBySlugResponse {
  data: CategoryDetail;
}

/**
 * 根据 slug 获取分类详情（包含子分类）
 */
export async function fetchCategoryBySlug(
  slug: string,
  params?: {
    includeChildrenArticles?: boolean;
  }
): Promise<CategoryBySlugResponse> {
  const queryString = buildQuery({
    includeChildrenArticles: params?.includeChildrenArticles,
  });
  const endpoint = `api/categories/slug/${slug}${
    queryString ? `?${queryString}` : ''
  }`;
  const options = isServerSide()
    ? ({ next: { revalidate: 60 } } as const)
    : undefined;
  return apiClient.get<CategoryBySlugResponse>(endpoint, options);
}

export interface ArticleDetail {
  id: number;
  documentId: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  viewCount: number;
  helpful: number;
  notHelpful: number;
  product: unknown | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string | null;
  categories: Array<{
    id: number;
    documentId: string;
    name: string;
    slug: string;
    description: string | null;
    level: number;
    path: string | null;
    sortOrder: number;
    isActive: boolean;
    color: string | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string | null;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  featuredImage: {
    id: number;
    documentId: string;
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats?: {
      small?: {
        ext: string;
        url: string;
        hash: string;
        mime: string;
        name: string;
        path: string | null;
        size: number;
        width: number;
        height: number;
        sizeInBytes: number;
      };
      medium?: {
        ext: string;
        url: string;
        hash: string;
        mime: string;
        name: string;
        path: string | null;
        size: number;
        width: number;
        height: number;
        sizeInBytes: number;
      };
      thumbnail?: {
        ext: string;
        url: string;
        hash: string;
        mime: string;
        name: string;
        path: string | null;
        size: number;
        width: number;
        height: number;
        sizeInBytes: number;
      };
    };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string | null;
    provider: string;
    provider_metadata: unknown | null;
    folderPath: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string | null;
  } | null;
  seo: unknown | null;
  relatedArticles: unknown[];
}

export interface ArticleBySlugResponse {
  data: ArticleDetail;
}

/**
 * 根据 slug 获取文章详情
 */
export async function fetchArticleBySlug(
  slug: string,
  locale?: string
): Promise<ArticleBySlugResponse> {
  const queryString = buildQuery({ locale });
  const endpoint = `api/articles/slug/${slug}${
    queryString ? `?${queryString}` : ''
  }`;
  const options = isServerSide()
    ? ({ next: { revalidate: 3600 } } as const)
    : undefined;
  return apiClient.get<ArticleBySlugResponse>(endpoint, options);
}
