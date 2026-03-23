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

export interface StrapiImage {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  formats?: {
    large?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    thumbnail?: { url: string; width: number; height: number };
  };
}

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
  categoryId: string;
  label: string;
  enabled: boolean;
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
 * 图文双栏展示组件
 */
export interface ImageTextBlockProps {
  image: StrapiImage;
  imagePosition: 'left' | 'right';
  title: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  badge?: string;
}

/**
 * Featured Product Item
 * 特色商品项
 */
export interface FeaturedProductItem {
  id: number;
  sku: string;
  label?: string;
  name: string;
  description?: string;
  features: string[];
  image: StrapiImage;
  price?: number;
  originalPrice?: number;
  discount?: number;
  productLink?: string;
}

/**
 * Featured Products Props
 * 特色商品列表组件
 */
export interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  products: FeaturedProductItem[];
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
  contentType: 'recipe' | 'blog' | 'mixed';
  items: ContentCard[];
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

// ============ Section Union Type ============

export type SectionType =
  | 'page.hero-banner'
  | 'page.category-grid'
  | 'page.product-carousel'
  | 'page.service-badges'
  | 'page.image-text-block'
  | 'page.featured-products'
  | 'page.content-carousel'
  | 'page.video-showcase';

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
  | Section<VideoShowcaseProps>;

// ============ Page Schema ============

export interface Page {
  id: number;
  documentId: string;
  slug: string;
  title: string;
  description?: string;
  featuredImage?: StrapiImage | null;
  seo?: SEO;
  sections: PageSection[];
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
    featuredImage?: StrapiImage | null;
    seo?: SEO;
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
