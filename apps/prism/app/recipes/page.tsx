import type { HeroSlide } from '@/app/components/HeroCarousel';
import { processImageUrl } from '@prism/shared';
import type { CarouselItemResponse } from '../../lib/api/carousel';
import { getCarouselItems } from '../../lib/api/carousel';
import { getFilterTypes, searchRecipes } from '../../lib/api/recipes';
import { RecipesClient } from './RecipesClient';
import type { SelectedFilters } from './types';

export const revalidate = 3600; // ISR 兜底 1 小时，主要依赖 On-Demand

type RecipesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_PAGE_SIZE = 12;

/**
 * 将 API 返回的数据转换为 HeroSlide 格式
 */
function transformToHeroSlides(items: CarouselItemResponse[]): HeroSlide[] {
  return items
    .filter(item => item.enabled) // 只显示启用的项
    .sort((a, b) => a.order - b.order) // 按 order 排序
    .map(item => {
      // 轮播图使用原图以保证清晰度
      const imageUrl = item.coverImage
        ? processImageUrl(item.coverImage.url)
        : '';

      // 构建链接 URL
      let linkUrl: string | undefined;
      if (item.linkType === 'internal' && item.linkUrl) {
        linkUrl = item.linkUrl;
      } else if (item.linkType === 'external' && item.linkUrl) {
        linkUrl = item.linkUrl;
      }

      return {
        image: imageUrl || '',
        alt: item.coverImage?.alternativeText || item.title,
        title: item.title,
        description: item.description || undefined,
        link: linkUrl,
      };
    });
}

function parseNumber(value: string | string[] | undefined, fallback: number) {
  if (Array.isArray(value)) {
    const first = Number(value[0]);
    return Number.isFinite(first) ? first : fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNumberArray(
  value: string | string[] | undefined
): number[] | undefined {
  if (!value) return undefined;

  const values = Array.isArray(value) ? value : value.split(',');
  const parsed = values
    .map(v => Number(v))
    .filter(num => Number.isFinite(num) && num > 0);

  return parsed.length > 0 ? parsed : undefined;
}

function buildSelectedFilters(
  searchParams: Record<string, string | string[] | undefined>
): SelectedFilters {
  const categoryIdValue = searchParams.categoryId;
  const categoryId =
    categoryIdValue !== undefined ? parseNumber(categoryIdValue, 0) : undefined;

  return {
    recipeTypes: parseNumberArray(searchParams.recipeTypes) ?? [],
    ingredients: parseNumberArray(searchParams.ingredients) ?? [],
    cuisines: parseNumberArray(searchParams.cuisines) ?? [],
    dishTypes: parseNumberArray(searchParams.dishTypes) ?? [],
    specialDiets: parseNumberArray(searchParams.specialDiets) ?? [],
    holidaysEvents: parseNumberArray(searchParams.holidaysEvents) ?? [],
    productTypes: parseNumberArray(searchParams.productTypes) ?? [],
    categoryId: categoryId && categoryId > 0 ? categoryId : undefined,
  };
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  // Next.js 15: searchParams 现在是 Promise，需要先 await
  const resolvedSearchParams = await searchParams;

  const page = Math.max(1, parseNumber(resolvedSearchParams.page, 1));
  const pageSize = Math.max(
    1,
    parseNumber(resolvedSearchParams.pageSize, DEFAULT_PAGE_SIZE)
  );
  const selectedFilters = buildSelectedFilters(resolvedSearchParams);

  // 构建时如果 API 不可用或权限不足，返回空数据以允许构建继续
  const [carouselRes, filterTypesResponse, recipesResponse] = await Promise.all(
    [
      getCarouselItems('recipe').catch(error => {
        console.error('[RecipesPage] Failed to fetch carousel items:', error);
        return { data: [] };
      }),
      getFilterTypes().catch(() => ({ data: [] })), // 构建时失败返回空数组
      searchRecipes({
        page,
        pageSize,
        includeFacets: true,
        ...selectedFilters,
      }).catch(() => ({
        data: [],
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: 0,
            total: 0,
          },
          facets: null,
        },
      })), // 构建时失败返回空数据
    ]
  );

  const slides = transformToHeroSlides(carouselRes.data);

  return (
    <RecipesClient
      recipes={recipesResponse.data}
      facets={recipesResponse.meta.facets || null}
      pagination={recipesResponse.meta.pagination}
      filterTypes={filterTypesResponse.data}
      selectedFilters={selectedFilters}
      page={page}
      pageSize={pageSize}
      carouselSlides={slides}
    />
  );
}
