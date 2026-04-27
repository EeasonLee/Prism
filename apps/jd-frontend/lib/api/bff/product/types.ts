export interface ProductCardItem {
  sku: string;
  name: string;
  displayName: string;
  shortName?: string | null;
  longTitle?: string | null;
  shortDescription?: string | null;
  urlKey: string | null;
  image: string | null;
  price: {
    value: number | null;
    currency: string | null;
  };
  originalPrice: number | null;
  inStock: boolean;
  type: string | null;
  promotionLabel: string | null;
  reviewCount: number;
  ratingPercentage: number;
  createdAt?: number;
  /**
   * 可配置商品变体与选项数据（来自 catalog-sync-service Redis 缓存）。
   * 当缓存未命中时为 undefined，前端可以继续通过单独接口获取。
   */
  variantData?: {
    options: Array<{
      attribute_id: number;
      code: string;
      label: string;
      values: Array<{ label: string; value: string }>;
    }>;
    customizable_options: Array<{
      option_id: number;
      title: string;
      required: boolean;
      type: string;
      values?: Array<{ option_type_id: number; title: string; price: number }>;
    }>;
    variants: Array<{
      sku: string;
      attributes: Record<string, string>;
      inStock: boolean;
      price: number;
    }>;
  };
}

export interface ProductListResult {
  items: ProductCardItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
