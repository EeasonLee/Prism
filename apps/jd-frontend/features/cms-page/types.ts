/**
 * CMS Page Domain Schema
 *
 * 这是 CMS 页面系统的 Domain Schema 层，定义了前端使用的类型。
 *
 * 三层 Schema 架构：
 * - CMS Schema (Strapi)：表单生成器，定义字段结构
 * - Domain Schema (本文件)：系统真实约束，权威类型定义
 * - React Props：组件 API，最稳定层
 *
 * 版本化原则：
 * - 新增能力用新类型（如 HeroBannerV2Props）
 * - 旧版本保持冻结，仅修 bug
 * - 禁止破坏性修改现有类型
 */

// ============ 基础类型 ============

export { type StrapiImage } from '@prism/shared';

export interface SEO {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: StrapiImage | null;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

// ============ Section Props (Domain Schema) ============

/**
 * Hero Banner Slide
 */
export interface HeroBannerSlide {
  id: number;
  image: StrapiImage;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  theme: 'light' | 'dark';
}

/**
 * Hero Banner Props
 * 首页轮播英雄区
 */
export interface HeroBannerProps {
  slides: HeroBannerSlide[];
  autoPlayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
}

/**
 * Category Item
 */
export interface CategoryItem {
  id: number;
  slug: string;
  label: string;
  magentoCategoryId?: number;
}

/**
 * Category Grid Props
 * 分类浏览网格
 */
export interface CategoryGridProps {
  title: string;
  categories: CategoryItem[];
}

/**
 * Product Carousel Props
 * 商品推荐轮播
 */
export interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  productSkus: string[]; // SKU 列表，组件内部调用 unified-product API
  layout: 'grid-2' | 'grid-3' | 'grid-6';
  showViewAll: boolean;
  viewAllLink?: string;
}

/**
 * Service Badge
 */
export interface ServiceBadge {
  id: number;
  icon: 'shield' | 'truck' | 'refresh' | 'headset';
  title: string;
  description: string;
}

/**
 * Service Badges Props
 * 服务保障列表
 */
export interface ServiceBadgesProps {
  badges: ServiceBadge[];
}

/**
 * Image Text Block Props
 * 首页首屏配置（单字段 JSON）
 */
export interface ImageTextBlockImageConfig {
  url: string;
  alt?: string;
}

export interface ImageTextBlockCtaConfig {
  text?: string;
  link?: string;
}

export interface ImageTextBlockMainConfig {
  productSku?: string;
  image?: ImageTextBlockImageConfig;
  title?: string;
  description?: string;
  badge?: string;
  cta?: ImageTextBlockCtaConfig;
  price?: {
    current?: number;
    original?: number;
    currency?: string;
  };
  addToCartText?: string;
}

export interface ImageTextBlockSideCardConfig {
  image?: ImageTextBlockImageConfig;
  eyebrow?: string;
  title?: string;
  cta?: ImageTextBlockCtaConfig;
}

export interface ImageTextBlockConfig {
  main?: ImageTextBlockMainConfig;
  sideCards?: ImageTextBlockSideCardConfig[];
  layout?: {
    imagePosition?: 'left' | 'right';
  };
}

export interface ImageTextBlockProps {
  config?: ImageTextBlockConfig;
}

/**
 * Featured Products Props
 * 特色商品列表组件
 */
export interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  products: string[]; // SKU 列表，组件内部调用 unified-product API
}

/**
 * Content Card
 * 内容卡片（食谱/博客）
 */
export interface ContentCard {
  id: number;
  type: 'recipe' | 'blog';
  title: string;
  description?: string;
  image: StrapiImage;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Content Carousel Props
 * 内容轮播组件
 */
export interface ContentCarouselProps {
  title: string;
  subtitle?: string;
  recipe: ContentCard[];
  article: ContentCard[];
  showViewAll: boolean;
  viewAllLink?: string;
}

/**
 * Video Item
 * 视频项
 */
export interface VideoItem {
  id: number;
  videoUrl: string;
  title: string;
  thumbnail?: StrapiImage | null;
}

/**
 * Video Showcase Props
 * 视频展示组件
 */
export interface VideoShowcaseProps {
  title: string;
  videos: VideoItem[];
}

/**
 * Deal Banner Slide
 * 专题页 Banner 单张幻灯片
 */
export interface DealBannerSlide {
  id: number;
  image: StrapiImage;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  theme: 'light' | 'dark';
}

/**
 * Deal Banner Props
 * 专题页顶部 Banner
 */
export interface DealBannerProps {
  slides: DealBannerSlide[];
  autoPlayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
}

/**
 * Deal Category Nav Item
 * 专题页分类导航项（图片+文字）
 */
export interface DealCategoryNavItem {
  id: number;
  categoryUrlKey: string;
  label: string;
  image: StrapiImage;
  link?: string;
}

/**
 * Deal Category Nav Props
 * 专题页分类图片导航
 */
export interface DealCategoryNavProps {
  title?: string;
  items: DealCategoryNavItem[];
}

/**
 * Deal Product Block Item
 * 单个分类产品区块配置
 */
export interface DealProductBlockItem {
  id: number;
  categoryName: string;
  categoryUrlKey: string;
  categoryLink?: string;
  productSkus: string[];
  layout: 'grid-2' | 'grid-3' | 'grid-4' | 'grid-6';
}

/**
 * Deal Product Blocks Props
 * 专题页多个分类产品区块
 */
export interface DealProductBlocksProps {
  blocks: DealProductBlockItem[];
}

// ============ Section Union Type ============

export type SectionType =
  | 'page.hero-banner'
  | 'page.category-grid'
  | 'page.product-carousel'
  | 'page.service-badges'
  | 'page.image-text-block'
  | 'page.featured-products'
  | 'page.content-carousel'
  | 'page.video-showcase'
  | 'page.deal-banner'
  | 'page.deal-category-nav'
  | 'page.deal-product-blocks';

export interface Section<T = unknown> {
  __component: SectionType;
  id: number;
  props: T;
}

export type PageSection =
  | Section<HeroBannerProps>
  | Section<CategoryGridProps>
  | Section<ProductCarouselProps>
  | Section<ServiceBadgesProps>
  | Section<ImageTextBlockProps>
  | Section<FeaturedProductsProps>
  | Section<ContentCarouselProps>
  | Section<VideoShowcaseProps>
  | Section<DealBannerProps>
  | Section<DealCategoryNavProps>
  | Section<DealProductBlocksProps>;

// ============ Page Schema ============

/** CMS Page 富文本区域的容器宽度预设（与 Strapi pages.layoutPreset 枚举一致） */
export type PageLayoutPreset = 'default' | 'narrow' | 'wide' | 'full';

/** 页面渲染模板（与 Strapi pages.template 枚举一致） */
export type PageTemplate = 'default' | 'category';

export interface Page {
  id: number;
  documentId: string;
  slug: string;
  title: string;
  description?: string;
  /** Strapi richtext（HTML 字符串） */
  content?: string | null;
  featuredImage?: StrapiImage | null;
  seo?: SEO;
  sections: PageSection[];
  /** 富文本与页面标题区域的布局预设 */
  layoutPreset: PageLayoutPreset;
  /** CMS 选择的页面模板（如 category 走专用布局） */
  template: PageTemplate;
  publishedAt?: string | null;
  locale?: string;
}

// ============ Strapi 原始响应类型 ============

export interface StrapiPageResponse {
  data: Array<{
    id: number;
    documentId: string;
    slug: string;
    title: string;
    description?: string;
    content?: string | null;
    featuredImage?: StrapiImage | null;
    seo?: SEO;
    layoutPreset?: unknown;
    template?: unknown;
    sections: Array<{
      __component: SectionType;
      id: number;
      [key: string]: unknown; // Strapi 原始字段
    }>;
    publishedAt?: string | null;
    locale?: string;
  }>;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
