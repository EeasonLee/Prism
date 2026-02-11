import type { HeroSlide } from '@/app/components/HeroCarousel';
import { HeroCarousel } from '@/app/components/HeroCarousel';
import { fetchCategoryByType } from '@/lib/api/articles'; // 使用应用层的导出，确保 API Client 已初始化
import type { CategoryDetail } from '@prism/blog'; // 导入类型定义
import { ArticleSearchBox } from '@prism/blog/components/ArticleSearchBox';
import { ProductCategories } from '@prism/blog/components/ProductCategories';
import { ThemeCategories } from '@prism/blog/components/ThemeCategories';
import { processImageUrl } from '@prism/shared';
import { PageContainer } from '@prism/ui/components/PageContainer';
import type { CarouselItemResponse } from '../../lib/api/carousel';
import { getCarouselItems } from '../../lib/api/carousel';

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

export const revalidate = 3600; // ISR 兜底 1 小时，主要依赖 On-Demand

export default async function BlogPage() {
  // 服务端获取轮播图数据、产品分类和主题分类
  const [carouselRes, categoryRes, themeRes] = await Promise.all([
    getCarouselItems('article').catch(error => {
      console.error('[BlogPage] Failed to fetch carousel items:', error);
      return { data: [] };
    }),
    fetchCategoryByType('product').catch(error => {
      console.error('[BlogPage] Failed to fetch product categories:', error);
      return null;
    }),
    fetchCategoryByType('theme', {
      includeChildrenArticles: true,
    }).catch(error => {
      console.error('[BlogPage] Failed to fetch theme category:', error);
      return null;
    }),
  ]);

  const slides = transformToHeroSlides(carouselRes.data);
  const productCategories: CategoryDetail[] =
    categoryRes?.data?.[0]?.children || [];
  const themeCategory = themeRes?.data[0] || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* 全屏轮播图 */}
      {slides.length > 0 ? (
        <div className="relative">
          <HeroCarousel
            slides={slides}
            height="h-[40vh] min-h-[240px] md:h-[500px] lg:h-[600px]"
            autoPlayInterval={5000}
            showIndicators
            showNavigation
            showContent={false}
          />
        </div>
      ) : null}

      {/* 搜索区域：移动端收紧重叠与内边距 */}
      <section className="relative z-10 mt-4 md:-mt-16">
        <PageContainer>
          <div className="mx-auto max-w-4xl">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-lg md:p-6 lg:p-8">
              <div className="mb-4 text-center md:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl">
                  Discover Your Next Read
                </h2>
                <p className="mt-2 text-base text-gray-600 md:mt-3 md:text-lg">
                  Explore our curated collection of articles, guides, and
                  insights
                </p>
              </div>
              <ArticleSearchBox
                placeholder="Search articles, keywords..."
                suggestionLimit={8}
                className="max-w-3xl mx-auto"
              />
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 产品分类区域 */}
      {productCategories.length > 0 && (
        <section className="py-8 md:py-12 lg:py-16">
          <ProductCategories
            categories={productCategories}
            title="By Product"
          />
        </section>
      )}

      {/* 主题分类区域 */}
      {themeCategory && (
        <section className="bg-white py-8 md:py-12 lg:py-16">
          <ThemeCategories category={themeCategory} />
        </section>
      )}
    </div>
  );
}
