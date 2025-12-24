import { PageContainer } from '@/app/components/PageContainer';
import { fetchCategoryBySlug } from '../../lib/api/articles';
import type { CarouselItemResponse } from '../../lib/api/carousel';
import { getCarouselItems } from '../../lib/api/carousel';
import { env } from '../../lib/env';
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
      // 获取最佳尺寸的图片（优先使用 large，其次 medium，最后使用原始）
      const imageUrl =
        item.coverImage.formats?.large?.url ||
        item.coverImage.formats?.medium?.url ||
        item.coverImage.url;

      // 构建完整图片 URL
      // 如果 URL 已经包含协议，直接使用；否则拼接 API base URL
      const apiBaseUrl = env.NEXT_PUBLIC_API_URL
        ? env.NEXT_PUBLIC_API_URL.replace('/api', '')
        : 'http://192.168.50.244:1337/';
      const fullImageUrl =
        imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
          ? imageUrl
          : `${apiBaseUrl}${
              imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
            }`;

      // 构建链接 URL
      let linkUrl: string | undefined;
      if (item.linkType === 'internal' && item.linkUrl) {
        linkUrl = item.linkUrl;
      } else if (item.linkType === 'external' && item.linkUrl) {
        linkUrl = item.linkUrl;
      }

      return {
        image: fullImageUrl,
        alt: item.coverImage.alternativeText || item.title,
        title: item.title,
        description: item.description || undefined,
        link: linkUrl,
      };
    });
}

export default async function BlogPage() {
  // 服务端获取轮播图数据、产品分类和主题分类
  const [carouselRes, categoryRes, themeRes] = await Promise.all([
    getCarouselItems('article'),
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
