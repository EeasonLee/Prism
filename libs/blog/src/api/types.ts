/**
 * Blog API 类型定义
 */

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

// 页面级类型（从 app/blog/types.ts 迁移）
export type ArticleItem = ArticleListItem;

export interface ArticlePagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface ArticlesSearchInitialData {
  items: ArticleItem[];
  pagination: ArticlePagination;
  degraded?: boolean;
}

export interface ArticlesFilters {
  q?: string;
  categoryId?: number;
  categoryLevel?: 1 | 2;
  tagIds?: number[];
  sort: ArticleSort;
  locale?: string;
}

// CategoryWithCounts 现在基于 CategoryDetail，但保留 articleCountWithChildren 字段用于兼容
export interface CategoryWithCounts extends CategoryDetail {
  articleCountWithChildren?: number;
}

export type TagOption = ArticleTag;
