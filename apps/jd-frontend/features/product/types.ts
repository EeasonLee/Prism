/**
 * 商品展示统一数据模型
 *
 * 所有商品展示组件（卡片、列表、详情）共享此类型。
 * 各数据源（Meilisearch、Magento REST、GraphQL）通过 display-mapper 映射到此模型。
 *
 * @see docs/product-display-rules.md
 */

// ─── 变体数据 ──────────────────────────────────────────────────────────────────

export interface VariantOptionValue {
  label: string;
  value: string;
}

export interface VariantOption {
  attribute_id: number;
  code: string;
  label: string;
  values: VariantOptionValue[];
}

export interface CustomizableOptionValue {
  option_type_id: number;
  title: string;
  sku?: string | null;
  price: number;
}

export interface CustomizableOption {
  option_id: number;
  title: string;
  required: boolean;
  type: string;
  values?: CustomizableOptionValue[];
}

export interface ProductVariant {
  sku: string;
  attributes: Record<string, string>;
  inStock: boolean;
  price: number;
}

export interface VariantData {
  options: VariantOption[];
  customizable_options: CustomizableOption[];
  variants: ProductVariant[];
}

// ─── 统一展示模型 ──────────────────────────────────────────────────────────────

export interface UnifiedProductDisplay {
  // === 基础标识 ===
  sku: string;

  // === 标题体系 ===
  /** 商品标题（PDP 使用） */
  name: string;
  /** 短标题（卡片优先使用，无值时 name 兜底） */
  short_name: string | null;
  /** 副标题（卡片、详情通用） */
  longtitle: string | null;
  /** 买点信息（富文本，需解析后渲染，禁止直接渲染 HTML） */
  short_description: string | null;

  // === 价格体系 ===
  /** 划线价（原价） */
  price: number;
  /** 售价（实际售价） */
  final_price: number;
  /** 折扣比例（price 和 final_price 计算，无折扣时为 null） */
  discount_percent: number | null;

  // === 优惠券 ===
  /** 优惠券码 */
  cp_code: string | null;
  /** 优惠券名称 */
  cp_label: string | null;
  /** 优惠券活动色（#RRGGBB） */
  cp_label_color: string | null;
  /** 优惠价格（抵扣金额） */
  cp_price: number | null;
  /** 优惠券开始时间（ISO 8601） */
  cp_starts_at: string | null;
  /** 优惠券结束时间（ISO 8601） */
  cp_expires_at: string | null;

  // === 库存 ===
  /** 是否有库存 */
  is_in_stock: boolean;

  // === 标签 ===
  /** 标签文字 */
  best_text: string | null;
  /** 标签颜色（#RRGGBB，品牌色兜底） */
  best_color: string | null;

  // === 评价 ===
  /** 评分（0-100） */
  rating_summary: number | null;
  /** 评论数 */
  review_count: number;
  /** 1-5 星各有多少评论 */
  rating_distribution: Record<1 | 2 | 3 | 4 | 5, number> | null;

  // === 图片 ===
  /** 主图 URL */
  image: string | null;

  // === 商品类型 ===
  /** simple | configurable | grouped | bundle | downloadable | virtual */
  type_id: string;
  /** URL 标识 */
  url_key: string | null;
  /** 可配置商品变体数据 */
  variant_data: VariantData | null;

  // === 货币 ===
  /** 货币代码（如 USD） */
  currency: string | null;
}
