/**
 * PDP 区块结构类型定义。
 * 仅包含类型声明，不包含任何 mock 数据。
 */

export interface KeyPoint {
  icon: string; // lucide icon name
  title: string;
  description: string;
}

export interface Guarantee {
  icon: string;
  title: string;
  description: string;
}

export interface DetailSection {
  image: string;
  imageAlt: string;
  title: string;
  body: string;
  reversed: boolean;
}

export interface Review {
  id: number;
  author: string;
  avatarInitials: string;
  rating: number; // 1-5
  date: string;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
}

export interface RecommendedProduct {
  id: number;
  sku: string;
  name: string;
  price: number;
  special_price?: number;
  currency?: string;
  image: string;
  badge?: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
  href?: string;
  time: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

export interface BlogPost {
  id: number;
  title: string;
  image: string;
  date: string;
  excerpt: string;
  href: string;
  readTime: string;
}

/** PDP 商品关联视频轮播（与 Strapi product-video / Prism fetch 字段对齐） */
export interface ProductVideoCard {
  id: number;
  title: string;
  caption: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface CrossSellAddon {
  id: number;
  sku: string;
  name: string;
  description: string;
  image: string;
  original_price: number;
  addon_price: number; // 与主商品同购时的折扣价
}

export interface BundleDeal {
  id: number;
  title: string;
  description: string;
  partner_products: Array<{
    sku: string;
    name: string;
    image: string;
    price: number;
  }>;
  bundle_price: number; // 主商品 + 所有伴购的合计
  original_total: number;
  savings: number;
}

export interface ProductPageExtras {
  promotion_countdown_to: string; // ISO 8601
  key_points: KeyPoint[];
  guarantees: Guarantee[];
  detail_sections: DetailSection[];
  reviews: Review[];
  review_summary: {
    average: number;
    total: number;
    distribution: Record<5 | 4 | 3 | 2 | 1, number>;
  };
  recommended_products: RecommendedProduct[];
  recipes: Recipe[];
  blog_posts: BlogPost[];
  product_videos: ProductVideoCard[];
  cross_sell_addons: CrossSellAddon[];
  bundle_deals: BundleDeal[];
}

/** PDP 中非 UnifiedProduct 的 CMS / 营销区块；未来由 Strapi 填充 */
export type ProductPageCms = ProductPageExtras;
