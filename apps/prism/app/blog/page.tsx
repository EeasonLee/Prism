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
            autoPlayInterval={5000}
            showIndicators
            showNavigation
          />
          {/* 渐变遮罩，让内容更易读 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : null}

      {/* 搜索区域 */}
      <section className="relative -mt-16 z-10">
        <PageContainer>
          <div className="mx-auto max-w-4xl">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 lg:p-8">
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">
                  Discover Your Next Read
                </h2>
                <p className="mt-3 text-lg text-gray-600">
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
        <section className="py-12 lg:py-16">
          <ProductCategories
            categories={productCategories}
            title="By Product"
          />
        </section>
      )}

      {/* 主题分类区域 */}
      {themeCategory && (
        <section className="py-12 lg:py-16 bg-white">
          <ThemeCategories category={themeCategory} />
        </section>
      )}
    </div>
  );
}
