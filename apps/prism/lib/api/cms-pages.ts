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

import { REVALIDATE_SECONDS_CMS_PAGE, cacheTagCmsPage } from './cache-policy';
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
  DealBannerProps,
  DealBannerSlide,
  DealCategoryNavProps,
  DealCategoryNavItem,
  DealProductBlocksProps,
  DealProductBlockItem,
} from './cms-page.types';

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
import { getStrapiBaseUrl } from './config';

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

/** Strapi 组件行内关联的食谱（populate 后扁平字段） */
interface RawRecipeRef {
  id?: number;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  excerpt?: string | null;
  prepTime?: number;
  cookTime?: number;
  featuredImage?: StrapiImageRaw | null;
  categories?: Array<{ id?: number; slug?: string | null }> | null;
  author?: { username?: string | null } | null;
}

/** Strapi 组件行内关联的文章 */
interface RawArticleRef {
  id?: number;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  featuredImage?: StrapiImageRaw | null;
  categories?: Array<{ id?: number; slug?: string | null }> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  author?: { username?: string | null } | null;
}

/**
 * 兼容 Strapi 响应：扁平 document，或 { data: { id, attributes } }
 */
function unwrapStrapiRelation<T extends object>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if ('data' in o) {
    const inner = o.data;
    if (inner === null || inner === undefined) return null;
    if (typeof inner === 'object' && inner !== null && !Array.isArray(inner)) {
      const d = inner as Record<string, unknown>;
      if (
        'attributes' in d &&
        d.attributes &&
        typeof d.attributes === 'object' &&
        d.attributes !== null
      ) {
        return {
          id: d.id,
          documentId: d.documentId,
          ...(d.attributes as T),
        } as unknown as T;
      }
      return inner as T;
    }
    return null;
  }
  return raw as T;
}

function formatRecipeTotalMinutes(recipe: RawRecipeRef): string {
  const total = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  if (total <= 0) return '';
  return `${total} min`;
}

function estimateArticleReadTime(text: string | null | undefined): string {
  const plain = (text ?? '').replace(/<[^>]+>/g, ' ').trim();
  if (!plain) return '3 min read';
  const words = plain.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function formatArticleCardDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function mapContentCarouselRowToCard(item: unknown): ContentCard | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as Record<string, unknown>;
  const componentId = typeof row.id === 'number' ? row.id : 0;

  const recipeRaw = unwrapStrapiRelation<RawRecipeRef>(row.recipe);
  if (recipeRaw?.slug) {
    const image = transformImage(recipeRaw.featuredImage);
    if (!image?.url) return null;

    const categorySlug = recipeRaw.categories?.[0]?.slug ?? 'recipe';
    const timeStr = formatRecipeTotalMinutes(recipeRaw);
    const description =
      recipeRaw.excerpt?.trim() ||
      (recipeRaw.description
        ? recipeRaw.description
            .replace(/<[^>]+>/g, ' ')
            .trim()
            .slice(0, 400)
        : '') ||
      undefined;

    const metadata: Record<string, unknown> = {};
    if (timeStr) metadata.time = timeStr;
    if (recipeRaw.author?.username) {
      metadata.author = recipeRaw.author.username;
    }

    return {
      id: recipeRaw.id ?? componentId,
      type: 'recipe',
      title: recipeRaw.title ?? '',
      description,
      image: image as StrapiImage,
      link: `/recipes/${categorySlug}/${recipeRaw.slug}`,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  }

  const articleRaw = unwrapStrapiRelation<RawArticleRef>(row.article);
  if (articleRaw?.slug) {
    const image = transformImage(articleRaw.featuredImage);
    if (!image?.url) return null;

    const categorySlug = articleRaw.categories?.[0]?.slug ?? 'articles';
    const dateRaw = articleRaw.createdAt ?? articleRaw.updatedAt;
    const dateLabel = formatArticleCardDate(dateRaw);

    const metadata: Record<string, unknown> = {
      readTime: estimateArticleReadTime(articleRaw.excerpt),
    };
    if (dateLabel) metadata.date = dateLabel;

    return {
      id: articleRaw.id ?? componentId,
      type: 'blog',
      title: articleRaw.title ?? '',
      description: articleRaw.excerpt ?? undefined,
      image: image as StrapiImage,
      link: `/blog/${categorySlug}/${articleRaw.slug}`,
      metadata,
    };
  }

  return null;
}

interface RawVideoItem {
  id?: number;
  videoUrl?: string;
  title?: string;
  thumbnail?: StrapiImageRaw | null;
}

interface RawDealBannerSlide {
  id?: number;
  image?: StrapiImageRaw | null;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string;
  ctaLink?: string;
  theme?: string;
}

interface RawDealCategoryNavItem {
  id?: number;
  categoryUrlKey?: string;
  label?: string;
  image?: StrapiImageRaw | null;
  link?: string;
}

interface RawDealProductBlockItem {
  id?: number;
  categoryName?: string;
  categoryUrlKey?: string;
  categoryLink?: string;
  productSkus?: string;
  layout?: string;
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
                width: image.formats.large.width ?? 0,
                height: image.formats.large.height ?? 0,
              }
            : undefined,
          medium: image.formats.medium
            ? {
                url: resolveStrapiUrl(image.formats.medium.url) || '',
                width: image.formats.medium.width ?? 0,
                height: image.formats.medium.height ?? 0,
              }
            : undefined,
          small: image.formats.small
            ? {
                url: resolveStrapiUrl(image.formats.small.url) || '',
                width: image.formats.small.width ?? 0,
                height: image.formats.small.height ?? 0,
              }
            : undefined,
          thumbnail: image.formats.thumbnail
            ? {
                url: resolveStrapiUrl(image.formats.thumbnail.url) || '',
                width: image.formats.thumbnail.width ?? 0,
                height: image.formats.thumbnail.height ?? 0,
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
          image: transformImage(
            rawProps.image as StrapiImageRaw | null | undefined
          ) as StrapiImage,
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
      const items: ContentCard[] = itemList
        .map(mapContentCarouselRowToCard)
        .filter((c): c is ContentCard => c !== null);

      if (items.length === 0 && itemList.length > 0) {
        console.warn(
          'page.content-carousel: items could not be mapped (check recipe/article relations and featured images)'
        );
      }

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

    case 'page.deal-banner': {
      const slideList = Array.isArray(rawProps.slides) ? rawProps.slides : [];
      const slides: DealBannerSlide[] = slideList.map(
        (slide): DealBannerSlide => {
          const s = slide as RawDealBannerSlide;
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
        } as DealBannerProps,
      };
    }

    case 'page.deal-category-nav': {
      const itemList = Array.isArray(rawProps.items) ? rawProps.items : [];
      const items: DealCategoryNavItem[] = itemList.map(
        (item): DealCategoryNavItem => {
          const i = item as RawDealCategoryNavItem;
          return {
            id: i.id ?? 0,
            categoryUrlKey: i.categoryUrlKey ?? '',
            label: i.label ?? '',
            image: transformImage(i.image) as StrapiImage,
            link: i.link,
          };
        }
      );

      return {
        __component,
        id,
        props: {
          title: rawProps.title,
          items,
        } as DealCategoryNavProps,
      };
    }

    case 'page.deal-product-blocks': {
      const blockList = Array.isArray(rawProps.blocks) ? rawProps.blocks : [];
      const blocks: DealProductBlockItem[] = blockList.map(
        (block): DealProductBlockItem => {
          const b = block as RawDealProductBlockItem;
          const skus = b.productSkus
            ? (b.productSkus as string)
                .split(',')
                .map(sku => sku.trim())
                .filter(sku => sku.length > 0)
            : [];
          const layout =
            b.layout === 'grid-2' ||
            b.layout === 'grid-3' ||
            b.layout === 'grid-4' ||
            b.layout === 'grid-6'
              ? b.layout
              : 'grid-4';
          return {
            id: b.id ?? 0,
            categoryName: b.categoryName ?? '',
            categoryUrlKey: b.categoryUrlKey ?? '',
            categoryLink: b.categoryLink,
            productSkus: skus,
            layout,
          };
        }
      );

      return {
        __component,
        id,
        props: {
          blocks,
        } as DealProductBlocksProps,
      };
    }

    default:
      console.warn(`Unknown section type: ${__component}`);
      return null;
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    // Strapi v5 对于 Dynamic Zone，必须使用 populate[field][on][component.name] 语法
    const populateParams = [
      'populate[sections][on][page.hero-banner][populate][slides][populate]=*',
      'populate[sections][on][page.category-grid][populate]=*',
      'populate[sections][on][page.product-carousel]=true',
      'populate[sections][on][page.service-badges][populate]=*',
      'populate[sections][on][page.image-text-block][populate]=*',
      'populate[sections][on][page.featured-products][populate][products][populate]=*',
      'populate[sections][on][page.content-carousel][populate][items][populate][recipe][populate]=*',
      'populate[sections][on][page.content-carousel][populate][items][populate][article][populate]=*',
      'populate[sections][on][page.video-showcase][populate][videos][populate]=*',
      'populate[sections][on][page.deal-banner][populate][slides][populate]=*',
      'populate[sections][on][page.deal-category-nav][populate][items][populate]=*',
      'populate[sections][on][page.deal-product-blocks]=true',
      'populate[seo][populate]=*',
      'populate[featuredImage]=true',
    ].join('&');

    const strapiUrl = `${getStrapiBaseUrl()}/api/pages?filters[slug][$eq]=${encodeURIComponent(
      slug
    )}&${populateParams}`;

    const response = await fetch(strapiUrl, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      next: {
        revalidate: REVALIDATE_SECONDS_CMS_PAGE,
        tags: [cacheTagCmsPage(slug)],
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Page not found: ${slug}`);
        return null;
      }
      throw new Error(
        `Strapi request failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = (await response.json()) as StrapiPageResponse;

    const pageData = responseData.data[0];
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
