import { PageContainer } from '@/app/components/PageContainer';
import { extractImageUrl } from '@/lib/utils/image';
import { fetchCategoryBySlug } from '../../lib/api/articles';
import type { CarouselItemResponse } from '../../lib/api/carousel';
import { getCarouselItems } from '../../lib/api/carousel';
import type { HeroSlide } from '../components/HeroCarousel';
import { HeroCarousel } from '../components/HeroCarousel';
import { ArticleSearchBox } from './components/ArticleSearchBox';
import { ProductCategories } from './components/ProductCategories';
import { ThemeCategories } from './components/ThemeCategories';

/**
 * 将 API 返回的数据转换为 HeroSlide 格式
 */
function transformToHeroSlides(items: CarouselItemResponse[]): HeroSlide[] {
  return items
    .filter(item => item.enabled) // 只显示启用的项
    .sort((a, b) => a.order - b.order) // 按 order 排序
    .map(item => {
      // 提取图片 URL（优先使用 large 格式）
      const imageUrl = extractImageUrl(item.coverImage, 'large');

      // 构建链接 URL
      let linkUrl: string | undefined;
      if (item.linkType === 'internal' && item.linkUrl) {
        linkUrl = item.linkUrl;
      } else if (item.linkType === 'external' && item.linkUrl) {
        linkUrl = item.linkUrl;
      }

      return {
        image: imageUrl || '',
        alt: item.coverImage.alternativeText || item.title,
        title: item.title,
        description: item.description || undefined,
        link: linkUrl,
      };
    });
}

export default async function BlogPage() {
  // 服务端获取轮播图数据、产品分类和主题分类
  // 构建时如果 API 不可用或权限不足，返回空数据以允许构建继续
  const [carouselRes, categoryRes, themeRes] = await Promise.all([
    getCarouselItems('article').catch(() => ({ data: [] })), // 构建时失败返回空数组
    fetchCategoryBySlug('by-product').catch(() => null), // 如果获取失败，返回 null
    fetchCategoryBySlug('theme', { includeChildrenArticles: true }).catch(
      () => null
    ), // 如果获取失败，返回 null
  ]);

  const slides = transformToHeroSlides(carouselRes.data);
  const productCategories = categoryRes?.data?.children || [];
  const themeCategory = themeRes?.data || null;

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
