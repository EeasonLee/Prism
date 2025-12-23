import { apiClient } from './client';

/**
 * API 返回的轮播图项数据
 */
export interface CarouselItemResponse {
  id: number;
  documentId: string;
  title: string;
  description: string | null;
  linkType: 'internal' | 'external';
  linkUrl: string | null;
  order: number;
  enabled: boolean;
  pageType: 'article' | 'recipe';
  coverImage: {
    id: number;
    documentId: string;
    name: string;
    alternativeText: string | null;
    width: number;
    height: number;
    formats?: {
      large?: {
        url: string;
        width: number;
        height: number;
      };
      medium?: {
        url: string;
        width: number;
        height: number;
      };
      small?: {
        url: string;
        width: number;
        height: number;
      };
      thumbnail?: {
        url: string;
        width: number;
        height: number;
      };
    };
    url: string;
  };
  targetArticle: unknown | null;
  targetRecipe: unknown | null;
}

/**
 * API 返回的数据结构
 */
export interface CarouselItemsResponse {
  data: CarouselItemResponse[];
}

/**
 * 构建查询参数
 */
function buildQueryString(pageType: 'article' | 'recipe'): string {
  // Strapi 过滤器格式: filters[pageType][$eq]=article
  return `filters[pageType][$eq]=${pageType}`;
}

/**
 * 获取轮播图数据
 * @param pageType 页面类型：'article' 用于博客，'recipe' 用于食谱
 */
export async function getCarouselItems(
  pageType: 'article' | 'recipe' = 'article'
): Promise<CarouselItemsResponse> {
  const queryString = buildQueryString(pageType);
  const endpoint = `api/carousel-items?${queryString}`;

  return apiClient.get<CarouselItemsResponse>(endpoint, {
    next: {
      revalidate: 60, // 缓存 60 秒
    },
  });
}
