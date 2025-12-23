import type { CarouselItemResponse } from '../../lib/api/carousel';
import { getCarouselItems } from '../../lib/api/carousel';
import { env } from '../../lib/env';
import type { HeroSlide } from '../components/HeroCarousel';
import { HeroCarousel } from '../components/HeroCarousel';
import { PageContainer } from '../components/PageContainer';

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
        : 'http://localhost:1337';
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
  // 服务端获取轮播图数据
  const { data } = await getCarouselItems('article');
  const slides = transformToHeroSlides(data);

  return (
    <div className="min-h-screen bg-white">
      {/* 全屏轮播图 */}
      {slides.length > 0 ? (
        <HeroCarousel
          slides={slides}
          // height="h-screen"
          autoPlayInterval={5000}
          showIndicators
          showNavigation
        />
      ) : null}

      {/* 博客内容区域 */}
      <PageContainer className="py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          <p className="mt-4 text-lg text-gray-600">
            Blog content will go here
          </p>
        </div>
      </PageContainer>
    </div>
  );
}
