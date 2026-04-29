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
import { getStrapiBaseUrl } from './config';
import { searchProductsBySkusForBFF } from './bff/product/meilisearch';
import { normalizePageLayoutPreset } from './cms-page-layout';
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
  ImageTextBlockConfig,
  FeaturedProductsProps,
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
  id?: number;
  slug?: string | null;
  name?: string | null;
  magento_category_id?: number | null;
}

interface RawServiceBadge {
  id?: number;
  icon?: ServiceBadge['icon'];
  title?: string | null;
  description?: string | null;
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

interface RawContentCardItem {
  id?: number;
  recipe?: unknown;
  article?: unknown;
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

function htmlToPlainText(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const plain = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 0 ? plain : undefined;
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

function mapRecipeToContentCard(recipeRaw: RawRecipeRef): ContentCard | null {
  if (!recipeRaw?.slug) return null;
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
    id: recipeRaw.id ?? 0,
    type: 'recipe',
    title: recipeRaw.title ?? '',
    description,
    image: image as StrapiImage,
    link: `/recipes/${categorySlug}/${recipeRaw.slug}`,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

function mapArticleToContentCard(
  articleRaw: RawArticleRef
): ContentCard | null {
  if (!articleRaw?.slug) return null;
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
    id: articleRaw.id ?? 0,
    type: 'blog',
    title: articleRaw.title ?? '',
    description: articleRaw.excerpt ?? undefined,
    image: image as StrapiImage,
    link: `/blog/${categorySlug}/${articleRaw.slug}`,
    metadata,
  };
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

  return `http://localhost:1337${url}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

/** Strapi richtext 在 REST 中多为 HTML 字符串 */
function normalizePageContent(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length > 0 ? t : undefined;
  }
  return undefined;
}

function normalizeImageTextBlockConfig(value: unknown): ImageTextBlockConfig {
  const configObj = asRecord(value);
  if (!configObj) return {};

  const layoutObj = asRecord(configObj.layout);
  const imagePosition = layoutObj?.imagePosition;
  const safePosition =
    imagePosition === 'left' || imagePosition === 'right'
      ? imagePosition
      : undefined;

  const mainObj = asRecord(configObj.main);
  const mainImageObj = asRecord(mainObj?.image);
  const mainImageUrl = asString(mainImageObj?.url);
  const mainImage = mainImageUrl
    ? {
        url: resolveStrapiUrl(mainImageUrl) || mainImageUrl,
        alt: asString(mainImageObj?.alt),
      }
    : undefined;

  const mainCtaObj = asRecord(mainObj?.cta);
  const mainPriceObj = asRecord(mainObj?.price);

  const main = mainObj
    ? {
        productSku: asString(mainObj.productSku),
        image: mainImage,
        title: asString(mainObj.title),
        description: asString(mainObj.description),
        badge: asString(mainObj.badge),
        cta: {
          text: asString(mainCtaObj?.text),
          link: asString(mainCtaObj?.link),
        },
        price: {
          current: asNumber(mainPriceObj?.current),
          original: asNumber(mainPriceObj?.original),
          currency: asString(mainPriceObj?.currency),
        },
        addToCartText: asString(mainObj.addToCartText),
      }
    : undefined;

  const sideCardList = Array.isArray(configObj.sideCards)
    ? configObj.sideCards
    : [];
  const sideCards = sideCardList
    .map(card => {
      const cardObj = asRecord(card);
      if (!cardObj) return null;

      const cardImageObj = asRecord(cardObj.image);
      const cardImageUrl = asString(cardImageObj?.url);
      const cardImage = cardImageUrl
        ? {
            url: resolveStrapiUrl(cardImageUrl) || cardImageUrl,
            alt: asString(cardImageObj?.alt),
          }
        : undefined;
      const cardCtaObj = asRecord(cardObj.cta);

      return {
        image: cardImage,
        eyebrow: asString(cardObj.eyebrow),
        title: asString(cardObj.title),
        cta: {
          text: asString(cardCtaObj?.text),
          link: asString(cardCtaObj?.link),
        },
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

  return {
    layout: safePosition ? { imagePosition: safePosition } : undefined,
    main,
    sideCards,
  };
}

async function enrichImageTextBlockConfig(
  config: ImageTextBlockConfig
): Promise<ImageTextBlockConfig> {
  const sku = config.main?.productSku?.trim();
  if (!sku) return config;

  try {
    const products = await searchProductsBySkusForBFF([sku]);
    const product = products[0];
    if (!product) return config;

    const productLink = `/products/${product.urlKey ?? product.sku}`;
    const resolvedImageUrl = config.main?.image?.url ?? product.image;
    const autoCurrentPrice = product.price.value ?? undefined;
    const autoOriginalPrice = product.originalPrice ?? undefined;

    return {
      ...config,
      main: {
        ...config.main,
        productSku: sku,
        image: resolvedImageUrl
          ? {
              url: resolvedImageUrl,
              alt:
                config.main?.image?.alt ??
                product.displayName ??
                product.name ??
                undefined,
            }
          : config.main?.image,
        title: config.main?.title ?? product.displayName ?? product.name,
        description:
          config.main?.description ??
          htmlToPlainText(product.shortDescription) ??
          '',
        cta: {
          text: config.main?.cta?.text ?? 'View Product',
          link: config.main?.cta?.link ?? productLink,
        },
        price: {
          current: config.main?.price?.current ?? autoCurrentPrice,
          original: config.main?.price?.original ?? autoOriginalPrice,
          currency:
            config.main?.price?.currency ?? product.price.currency ?? 'USD',
        },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to enrich image-text-block by sku ${sku}: ${message}`);
    return config;
  }
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
async function transformSection(
  rawSection: RawStrapiSection
): Promise<PageSection | null> {
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
        const c = unwrapStrapiRelation<RawCategoryItem>(cat) ?? {};
        return {
          id: c.id ?? 0,
          slug: c.slug ?? '',
          label: c.name ?? '',
          magentoCategoryId:
            typeof c.magento_category_id === 'number'
              ? c.magento_category_id
              : undefined,
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
      const config = normalizeImageTextBlockConfig(rawProps.config);
      const enrichedConfig = await enrichImageTextBlockConfig(config);
      return {
        __component,
        id,
        props: {
          config: enrichedConfig,
        } as ImageTextBlockProps,
      };
    }

    case 'page.featured-products': {
      const products = Array.isArray(rawProps.products)
        ? rawProps.products
            .map(item => {
              if (!item || typeof item !== 'object') return '';
              const sku = (item as { sku?: unknown }).sku;
              return typeof sku === 'string' ? sku : '';
            })
            .map(sku => sku.trim())
            .filter((sku): sku is string => sku.length > 0)
        : typeof rawProps.products === 'string'
        ? rawProps.products
            .split(/[\n,]+/)
            .map(sku => sku.trim())
            .filter((sku): sku is string => sku.length > 0)
        : [];

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
      const contentCardItems = Array.isArray(rawProps.items)
        ? rawProps.items
        : [];
      const recipeRelationListFromItems: unknown[] = [];
      const articleRelationListFromItems: unknown[] = [];

      contentCardItems.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const card = item as RawContentCardItem;
        if (card.recipe) recipeRelationListFromItems.push(card.recipe);
        if (card.article) articleRelationListFromItems.push(card.article);
      });

      // 兼容旧数据：历史上 content-carousel 可能直接挂了 recipe/article 数组
      const recipeRelationList = recipeRelationListFromItems.length
        ? recipeRelationListFromItems
        : Array.isArray(rawProps.recipe)
        ? rawProps.recipe
        : [];
      const articleRelationList = articleRelationListFromItems.length
        ? articleRelationListFromItems
        : Array.isArray(rawProps.article)
        ? rawProps.article
        : [];

      const recipe = recipeRelationList
        .map(item => unwrapStrapiRelation<RawRecipeRef>(item))
        .filter((item): item is RawRecipeRef => item !== null)
        .map(mapRecipeToContentCard)
        .filter((c): c is ContentCard => c !== null);
      const article = articleRelationList
        .map(item => unwrapStrapiRelation<RawArticleRef>(item))
        .filter((item): item is RawArticleRef => item !== null)
        .map(mapArticleToContentCard)
        .filter((c): c is ContentCard => c !== null);

      if (
        recipe.length === 0 &&
        recipeRelationList.length > 0 &&
        article.length === 0 &&
        articleRelationList.length > 0
      ) {
        console.warn(
          'page.content-carousel: recipe/article relations could not be mapped (check relations and featured images)'
        );
      }

      return {
        __component,
        id,
        props: {
          title: rawProps.title || '',
          subtitle: rawProps.subtitle,
          recipe,
          article,
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
    const populateParams = [
      'populate[sections][on][page.hero-banner][populate][slides][populate]=*',
      'populate[sections][on][page.category-grid][populate][categories][fields][0]=name',
      'populate[sections][on][page.category-grid][populate][categories][fields][1]=slug',
      'populate[sections][on][page.category-grid][populate][categories][fields][2]=magento_category_id',
      'populate[sections][on][page.product-carousel]=true',
      'populate[sections][on][page.service-badges][populate]=*',
      'populate[sections][on][page.image-text-block][populate]=*',
      'populate[sections][on][page.featured-products]=true',
      'populate[sections][on][page.content-carousel][populate][recipe][populate]=*',
      'populate[sections][on][page.content-carousel][populate][article][populate]=*',
      'populate[sections][on][page.video-showcase][populate][videos][populate]=*',
      'populate[seo][populate]=*',
      'populate[featuredImage]=*',
    ].join('&');

    const strapiUrl = `${getStrapiBaseUrl()}/api/pages?filters[slug][$eq]=${encodeURIComponent(
      slug
    )}&locale=en&${populateParams}`;

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

    console.log('responseData', responseData);

    const pageData = responseData.data[0];
    if (!pageData) {
      console.warn(`Page not found: ${slug}`);
      return null;
    }

    // 转换 sections
    const sectionsRaw = await Promise.all(
      (pageData.sections || []).map(transformSection)
    );
    const sections = sectionsRaw.filter((s): s is PageSection => s !== null);

    return {
      id: pageData.id,
      documentId: pageData.documentId,
      slug: pageData.slug,
      title: pageData.title,
      description: pageData.description,
      content: normalizePageContent(pageData.content),
      featuredImage: transformImage(pageData.featuredImage),
      seo: pageData.seo,
      sections,
      layoutPreset: normalizePageLayoutPreset(pageData.layoutPreset),
      publishedAt: pageData.publishedAt,
      locale: pageData.locale,
    };
  } catch (error) {
    console.error(`Failed to fetch page: ${slug}`, error);
    return null;
  }
}
