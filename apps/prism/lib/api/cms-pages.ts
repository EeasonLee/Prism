/**
 * CMS Pages API
 *
 * 提供从 Strapi 获取 CMS 页面数据的 API 函数。
 *
 * 核心功能：
 * - 按 slug 获取页面数据
 * - 将 Strapi 原始响应转换为 Domain Schema
 * - 支持 ISR 缓存
 * - 错误处理：失败时返回 null，不抛异常
 */

import { apiClient } from './client';
import type {
  Page,
  StrapiPageResponse,
  PageSection,
  HeroBannerProps,
  HeroBannerSlide,
  CategoryGridProps,
  CategoryItem,
  ProductCarouselProps,
  ServiceBadgesProps,
  ServiceBadge,
  StrapiImage,
  ImageTextBlockProps,
  FeaturedProductsProps,
  FeaturedProductItem,
  ContentCarouselProps,
  ContentCard,
  VideoShowcaseProps,
  VideoItem,
} from './cms-page.types';

/** Strapi Media / Image 嵌套结构（API 原始形态，字段可选） */
interface StrapiImageFormatRaw {
  url?: string | null;
  width?: number;
  height?: number;
}

interface StrapiImageRaw {
  id?: number;
  documentId?: string;
  url?: string | null;
  alternativeText?: string | null;
  width?: number;
  height?: number;
  formats?: {
    large?: StrapiImageFormatRaw;
    medium?: StrapiImageFormatRaw;
    small?: StrapiImageFormatRaw;
    thumbnail?: StrapiImageFormatRaw;
  };
}

interface RawStrapiSection {
  __component: string;
  id: number;
  [key: string]: unknown;
}

interface RawHeroBannerSlide {
  id?: number;
  image?: StrapiImageRaw | null;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string;
  ctaLink?: string;
  theme?: string;
}

interface RawCategoryItem {
  categoryId?: string;
  label?: string;
  enabled?: boolean;
}

interface RawServiceBadge {
  id?: number;
  icon?: ServiceBadge['icon'];
  title?: string | null;
  description?: string | null;
}

interface RawFeaturedProduct {
  id?: number;
  sku?: string;
  label?: string;
  name?: string | null;
  description?: string;
  features?: unknown;
  image?: StrapiImageRaw | null;
  price?: number;
  originalPrice?: number;
  discount?: number;
  productLink?: string;
}

interface RawContentCard {
  id?: number;
  type?: string;
  title?: string | null;
  description?: string;
  image?: StrapiImageRaw | null;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface RawVideoItem {
  id?: number;
  videoUrl?: string;
  title?: string;
  thumbnail?: StrapiImageRaw | null;
}

/**
 * 解析 Strapi URL
 * 如果是相对路径，拼接 API 基础 URL
 */
function resolveStrapiUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;

  const base = process.env.NEXT_PUBLIC_API_URL || '';
  return `${base}${url}`;
}

/**
 * 转换 Strapi Image 为标准格式
 */
function transformImage(
  image: StrapiImageRaw | null | undefined
): StrapiImage | null {
  if (!image) return null;

  return {
    id: image.id ?? 0,
    documentId: image.documentId ?? '',
    url: resolveStrapiUrl(image.url) || '',
    alternativeText: image.alternativeText || null,
    width: image.width || 0,
    height: image.height || 0,
    formats: image.formats
      ? {
          large: image.formats.large
            ? {
                url: resolveStrapiUrl(image.formats.large.url) || '',
                width: image.formats.large.width,
                height: image.formats.large.height,
              }
            : undefined,
          medium: image.formats.medium
            ? {
                url: resolveStrapiUrl(image.formats.medium.url) || '',
                width: image.formats.medium.width,
                height: image.formats.medium.height,
              }
            : undefined,
          small: image.formats.small
            ? {
                url: resolveStrapiUrl(image.formats.small.url) || '',
                width: image.formats.small.width,
                height: image.formats.small.height,
              }
            : undefined,
          thumbnail: image.formats.thumbnail
            ? {
                url: resolveStrapiUrl(image.formats.thumbnail.url) || '',
                width: image.formats.thumbnail.width,
                height: image.formats.thumbnail.height,
              }
            : undefined,
        }
      : undefined,
  };
}

/**
 * 将 Strapi 原始 section 转换为 Domain Schema
 *
 * 版本化规则：
 * - 新增能力用新 case（如 'page.hero-banner-v2'）
 * - 旧版本保持冻结，仅修 bug
 * - 禁止破坏性修改现有 Section
 */
function transformSection(rawSection: RawStrapiSection): PageSection | null {
  const { __component, id, ...rawProps } = rawSection;

  switch (__component) {
    case 'page.hero-banner': {
      const slideList = Array.isArray(rawProps.slides) ? rawProps.slides : [];
      const slides: HeroBannerSlide[] = slideList.map(
        (slide): HeroBannerSlide => {
          const s = slide as RawHeroBannerSlide;
          return {
            id: s.id ?? 0,
            image: transformImage(s.image) as StrapiImage,
            title: s.title ?? '',
            subtitle: s.subtitle ?? '',
            ctaText: s.ctaText,
            ctaLink: s.ctaLink,
            theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : 'dark',
          };
        }
      );

      return {
        __component,
        id,
        props: {
          slides,
          autoPlayInterval: rawProps.autoPlayInterval,
          showArrows: rawProps.showArrows !== false,
          showDots: rawProps.showDots !== false,
        } as HeroBannerProps,
      };
    }

    case 'page.category-grid': {
      const catList = Array.isArray(rawProps.categories)
        ? rawProps.categories
        : [];
      const categories: CategoryItem[] = catList.map((cat): CategoryItem => {
        const c = cat as RawCategoryItem;
        return {
          categoryId: c.categoryId ?? '',
          label: c.label ?? '',
          enabled: c.enabled !== false,
        };
      });

      return {
        __component,
        id,
        props: {
          title: rawProps.title || '',
          categories,
        } as CategoryGridProps,
      };
    }

    case 'page.product-carousel': {
      // 解析逗号分隔的 SKU 字符串
      const productSkus = rawProps.productSkus
        ? (rawProps.productSkus as string)
            .split(',')
            .map(sku => sku.trim())
            .filter(sku => sku.length > 0)
        : [];

      return {
        __component,
        id,
        props: {
          title: rawProps.title || '',
          subtitle: rawProps.subtitle,
          productSkus,
          layout: rawProps.layout || 'grid-6',
          showViewAll: rawProps.showViewAll !== false,
          viewAllLink: rawProps.viewAllLink,
        } as ProductCarouselProps,
      };
    }

    case 'page.service-badges': {
      const badgeList = Array.isArray(rawProps.badges) ? rawProps.badges : [];
      const badges: ServiceBadge[] = badgeList.map((badge): ServiceBadge => {
        const b = badge as RawServiceBadge;
        const icon = b.icon ?? 'shield';
        const safeIcon: ServiceBadge['icon'] =
          icon === 'shield' ||
          icon === 'truck' ||
          icon === 'refresh' ||
          icon === 'headset'
            ? icon
            : 'shield';
        return {
          id: b.id ?? 0,
          icon: safeIcon,
          title: b.title ?? '',
          description: b.description ?? '',
        };
      });

      return {
        __component,
        id,
        props: {
          badges,
        } as ServiceBadgesProps,
      };
    }

    case 'page.image-text-block': {
      return {
        __component,
        id,
        props: {
          image: transformImage(rawProps.image) as StrapiImage,
          imagePosition: rawProps.imagePosition || 'right',
          title: rawProps.title || '',
          description: rawProps.description,
          ctaText: rawProps.ctaText,
          ctaLink: rawProps.ctaLink,
          badge: rawProps.badge,
        } as ImageTextBlockProps,
      };
    }

    case 'page.featured-products': {
      const productList = Array.isArray(rawProps.products)
        ? rawProps.products
        : [];
      const products: FeaturedProductItem[] = productList.map(
        (product): FeaturedProductItem => {
          const p = product as RawFeaturedProduct;
          const rawFeatures = p.features;
          const features = Array.isArray(rawFeatures)
            ? rawFeatures.filter((f): f is string => typeof f === 'string')
            : [];
          return {
            id: p.id ?? 0,
            sku: p.sku ?? '',
            label: p.label,
            name: p.name ?? '',
            description: p.description,
            features,
            image: transformImage(p.image) as StrapiImage,
            price: p.price,
            originalPrice: p.originalPrice,
            discount: p.discount,
            productLink: p.productLink,
          };
        }
      );

      return {
        __component,
        id,
        props: {
          title: rawProps.title || '',
          subtitle: rawProps.subtitle,
          products,
        } as FeaturedProductsProps,
      };
    }

    case 'page.content-carousel': {
      const itemList = Array.isArray(rawProps.items) ? rawProps.items : [];
      const items: ContentCard[] = itemList.map((item): ContentCard => {
        const it = item as RawContentCard;
        const typeRaw = it.type;
        const type: ContentCard['type'] =
          typeRaw === 'blog' || typeRaw === 'recipe' ? typeRaw : 'recipe';
        return {
          id: it.id ?? 0,
          type,
          title: it.title ?? '',
          description: it.description,
          image: transformImage(it.image) as StrapiImage,
          link: it.link,
          metadata: it.metadata,
        };
      });

      return {
        __component,
        id,
        props: {
          title: rawProps.title || '',
          subtitle: rawProps.subtitle,
          contentType: rawProps.contentType || 'recipe',
          items,
          showViewAll: rawProps.showViewAll !== false,
          viewAllLink: rawProps.viewAllLink,
        } as ContentCarouselProps,
      };
    }

    case 'page.video-showcase': {
      const videoList = Array.isArray(rawProps.videos) ? rawProps.videos : [];
      const videos: VideoItem[] = videoList.map((video): VideoItem => {
        const v = video as RawVideoItem;
        return {
          id: v.id ?? 0,
          videoUrl: v.videoUrl ?? '',
          title: v.title ?? '',
          thumbnail: transformImage(v.thumbnail),
        };
      });

      return {
        __component,
        id,
        props: {
          title: rawProps.title || '',
          videos,
        } as VideoShowcaseProps,
      };
    }

    default:
      console.warn(`Unknown section type: ${__component}`);
      return null;
  }
}

/**
 * 按 slug 获取 Page
 *
 * @param slug - 页面 slug（如 'home'）
 * @returns Page 数据，失败时返回 null
 *
 * 使用示例：
 * ```typescript
 * const page = await getPageBySlug('home');
 * if (page) {
 *   // 渲染页面
 * } else {
 *   // 使用 fallback
 * }
 * ```
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    // Strapi v5 对于 Dynamic Zone，必须使用 populate[field][on][component.name] 语法
    // 针对不同的 component 类型使用不同的 populate 规则
    const populateParams = [
      'populate[sections][on][page.hero-banner][populate][slides][populate]=*',
      'populate[sections][on][page.category-grid][populate]=*',
      'populate[sections][on][page.product-carousel]=true',
      'populate[sections][on][page.service-badges][populate]=*',
      'populate[sections][on][page.image-text-block][populate]=*',
      'populate[sections][on][page.featured-products][populate][products][populate]=*',
      'populate[sections][on][page.content-carousel][populate][items][populate]=*',
      'populate[sections][on][page.video-showcase][populate][videos][populate]=*',
      'populate[seo][populate]=*',
      'populate[featuredImage]=true',
    ].join('&');

    const response = await apiClient.get<StrapiPageResponse>(
      `api/pages?filters[slug][$eq]=${encodeURIComponent(
        slug
      )}&${populateParams}`,
      {
        next: {
          revalidate: 60, // ISR 60s 缓存
          tags: [`cms-page:${slug}`],
        },
      }
    );

    const pageData = response.data[0];
    if (!pageData) {
      console.warn(`Page not found: ${slug}`);
      return null;
    }

    // 转换 sections
    const sections = (pageData.sections || [])
      .map(transformSection)
      .filter((s): s is PageSection => s !== null);

    return {
      id: pageData.id,
      documentId: pageData.documentId,
      slug: pageData.slug,
      title: pageData.title,
      description: pageData.description,
      featuredImage: transformImage(pageData.featuredImage),
      seo: pageData.seo,
      sections,
      publishedAt: pageData.publishedAt,
      locale: pageData.locale,
    };
  } catch (error) {
    console.error(`Failed to fetch page: ${slug}`, error);
    return null;
  }
}
