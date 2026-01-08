import type {
  CategoryDetail,
  ArticleTag,
  ArticleListItem,
  ArticleSort,
} from '@prism/blog';

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
  categoryIds?: number[];
  tagIds?: number[];
  sort: ArticleSort;
  locale?: string;
}

// CategoryWithCounts 现在基于 CategoryDetail，但保留 articleCountWithChildren 字段用于兼容
export interface CategoryWithCounts extends CategoryDetail {
  articleCountWithChildren?: number;
}
export type TagOption = ArticleTag;
