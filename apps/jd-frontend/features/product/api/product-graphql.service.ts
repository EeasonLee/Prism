/**
 * Magento 商品详情服务（BFF 专用）
 *
 * 直接通过 NEXT_PUBLIC_MAGENTO_GRAPHQL_URL 查询 Magento GraphQL，
 * 不经过 13000 代理（与分类服务保持一致）。
 */

import { magentoGraphQL } from '@/infrastructure/api/clients/magento-graphql';

// ─── GraphQL 类型 ──────────────────────────────────────────────────────────────

interface GQLVideoContent {
  media_type: string;
  video_provider: string;
  video_url: string;
  video_title: string;
  video_description: string;
  video_metadata: string;
}

interface GQLMediaGallery {
  url: string;
  label: string | null;
  position: number;
  disabled: boolean;
  video_content?: GQLVideoContent | null;
}

interface GQLConfigurableOption {
  attribute_id: number;
  attribute_code: string;
  label: string;
  values: Array<{ value_index: number; label: string }>;
}

interface GQLVariantProduct {
  id: number;
  sku: string;
  url_key: string | null;
  name: string;
  cp_label: string | null;
  cp_code: string | null;
  cp_date: string | null;
  /** 优惠券抵扣金额（GraphQL 可能返回 number 或 string） */
  cp_price?: number | string | null;
  stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
  price_range: {
    minimum_price: {
      regular_price: { value: number; currency: string };
      final_price: { value: number; currency: string };
    };
  };
  media_gallery: GQLMediaGallery[];
}

interface GQLVariantAttribute {
  code: string;
  value_index: number;
  label: string;
}

interface GQLCustomizableSelectionValue {
  option_type_id: number;
  title: string;
  sku?: string | null;
  price: number;
  price_type: string;
  sort_order: number;
}

interface GQLCustomizableTextValue {
  price: number;
  price_type: string;
  max_characters?: number | null;
}

interface GQLCustomizableOption {
  __typename: string;
  option_id: number;
  title: string;
  required: boolean;
  sort_order: number;
  // aliased selection values
  drop_down_value?: GQLCustomizableSelectionValue[] | null;
  radio_value?: GQLCustomizableSelectionValue[] | null;
  checkbox_value?: GQLCustomizableSelectionValue[] | null;
  multiple_value?: GQLCustomizableSelectionValue[] | null;
  // aliased text values
  field_value?: GQLCustomizableTextValue | null;
  area_value?: GQLCustomizableTextValue | null;
}

interface GQLVariant {
  product: GQLVariantProduct;
  attributes: GQLVariantAttribute[];
}

export interface GQLLinkedProduct {
  id: number;
  sku: string;
  name: string;
  url_key: string | null;
  thumbnail: { url: string; label: string | null } | null;
  price_range: {
    minimum_price: {
      regular_price: { value: number; currency: string };
      final_price: { value: number; currency: string };
    };
  };
  stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
}

interface GQLProduct {
  __typename: string;
  id: number;
  sku: string;
  url_key: string | null;
  name: string;
  // 自定义属性
  cp_label: string | null;
  cp_code: string | null;
  cp_date: string | null;
  /** 优惠券抵扣金额（GraphQL 可能返回 number 或 string） */
  cp_price?: number | string | null;
  meta_title: string | null;
  meta_description: string | null;
  specifications?: string | null;
  faqs?: string | null;
  description: { html: string } | null;
  short_description: { html: string } | null;
  price_range: {
    minimum_price: {
      regular_price: { value: number; currency: string };
      final_price: { value: number; currency: string };
    };
  };
  media_gallery: GQLMediaGallery[];
  thumbnail: { url: string; label: string | null } | null;
  stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
  rating_summary: number;
  review_count: number;
  categories: Array<{
    id: number;
    name: string;
    level: number;
    url_key: string | null;
    url_path: string | null;
  }>;
  related_products: GQLLinkedProduct[];
  upsell_products: GQLLinkedProduct[];
  configurable_options: GQLConfigurableOption[] | null;
  variants: GQLVariant[] | null;
  options?: GQLCustomizableOption[] | null;
}

interface GQLProductsResponse {
  products: {
    items: GQLProduct[];
  };
}

// ─── GraphQL 查询 ──────────────────────────────────────────────────────────────

const PRODUCT_DETAIL_QUERY = `
  query GetProductDetail($sku: String!) {
    products(filter: { sku: { eq: $sku } }) {
      items {
        __typename
        id
        sku
        url_key
        name

        cp_label
        cp_code
        cp_date
        cp_price
        meta_title
        meta_description
        specifications
        faqs
        description { html }
        short_description { html }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price { value currency }
          }
        }
        media_gallery {
          url
          label
          position
          disabled
          ... on ProductVideo {
            video_content {
              media_type
              video_provider
              video_url
              video_title
              video_description
              video_metadata
            }
          }
        }
        thumbnail { url label }
        stock_status
        rating_summary
        review_count
        categories { id name level url_key url_path }
        related_products {
          id
          name
          sku
          url_key
          thumbnail { url label }
          price_range {
            minimum_price {
              regular_price { value currency }
              final_price { value currency }
            }
          }
          stock_status
        }
        upsell_products {
          id
          name
          sku
          url_key
          thumbnail { url label }
          price_range {
            minimum_price {
              regular_price { value currency }
              final_price { value currency }
            }
          }
          stock_status
        }
        ... on CustomizableProductInterface {
          options {
            option_id
            title
            required
            sort_order
            __typename
            ... on CustomizableDropDownOption {
              dropdownValue: value { option_type_id title sku price price_type sort_order }
            }
            ... on CustomizableRadioOption {
              radioValue: value { option_type_id title sku price price_type sort_order }
            }
            ... on CustomizableCheckboxOption {
              checkboxValue: value { option_type_id title sku price price_type sort_order }
            }
            ... on CustomizableMultipleOption {
              multipleValue: value { option_type_id title sku price price_type sort_order }
            }
            ... on CustomizableFieldOption {
              fieldValue: value { price price_type max_characters }
            }
            ... on CustomizableAreaOption {
              areaValue: value { price price_type max_characters }
            }
          }
        }
        ... on ConfigurableProduct {
          configurable_options {
            attribute_id
            attribute_code
            label
            values { value_index label }
          }
          variants {
            product {
              id
              sku
              url_key
              name
              cp_label
              cp_code
              cp_date
              cp_price
              stock_status
              price_range {
                minimum_price {
                  regular_price { value currency }
                  final_price { value currency }
                }
              }
              media_gallery {
                url
                label
                position
                disabled
                ... on ProductVideo {
                  video_content {
                    media_type
                    video_provider
                    video_url
                    video_title
                    video_description
                    video_metadata
                  }
                }
              }
            }
            attributes { code value_index label }
          }
        }
      }
    }
  }
`;

const PRODUCT_DETAIL_BY_URL_KEY_QUERY = `
  query GetProductDetailByUrlKey($url_key: String!) {
    products(filter: { url_key: { eq: $url_key } }) {
      items {
        __typename
        id
        sku
        url_key
        name

        cp_label
        cp_code
        cp_date
        cp_price
        meta_title
        meta_description
        specifications
        faqs
        description { html }
        short_description { html }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price { value currency }
          }
        }
        media_gallery {
          url
          label
          position
          disabled
          ... on ProductVideo {
            video_content {
              media_type
              video_provider
              video_url
              video_title
              video_description
              video_metadata
            }
          }
        }
        thumbnail { url label }
        stock_status
        rating_summary
        review_count
        categories { id name level url_key url_path }
        related_products {
          id
          name
          sku
          url_key
          thumbnail { url label }
          price_range {
            minimum_price {
              regular_price { value currency }
              final_price { value currency }
            }
          }
          stock_status
        }
        upsell_products {
          id
          name
          sku
          url_key
          thumbnail { url label }
          price_range {
            minimum_price {
              regular_price { value currency }
              final_price { value currency }
            }
          }
          stock_status
        }
        ... on CustomizableProductInterface {
          options {
            option_id
            title
            required
            sort_order
            __typename
            ... on CustomizableDropDownOption {
              dropdownValue: value { option_type_id title sku price price_type sort_order }
            }
            ... on CustomizableRadioOption {
              radioValue: value { option_type_id title sku price price_type sort_order }
            }
            ... on CustomizableCheckboxOption {
              checkboxValue: value { option_type_id title sku price price_type sort_order }
            }
            ... on CustomizableMultipleOption {
              multipleValue: value { option_type_id title sku price price_type sort_order }
            }
            ... on CustomizableFieldOption {
              fieldValue: value { price price_type max_characters }
            }
            ... on CustomizableAreaOption {
              areaValue: value { price price_type max_characters }
            }
          }
        }
        ... on ConfigurableProduct {
          configurable_options {
            attribute_id
            attribute_code
            label
            values { value_index label }
          }
          variants {
            product {
              id
              sku
              url_key
              name
              cp_label
              cp_code
              cp_date
              cp_price
              stock_status
              price_range {
                minimum_price {
                  regular_price { value currency }
                  final_price { value currency }
                }
              }
              media_gallery {
                url
                label
                position
                disabled
                ... on ProductVideo {
                  video_content {
                    media_type
                    video_provider
                    video_url
                    video_title
                    video_description
                    video_metadata
                  }
                }
              }
            }
            attributes { code value_index label }
          }
        }
      }
    }
  }
`;

// ─── 主函数 ────────────────────────────────────────────────────────────────────

export async function fetchProductDetailBySkuGQL(
  sku: string
): Promise<GQLProduct> {
  const response = await magentoGraphQL<GQLProductsResponse>(
    PRODUCT_DETAIL_QUERY,
    { sku }
  );

  const item = response.products.items[0];
  if (!item) {
    throw new Error(`Product not found: ${sku}`);
  }

  return item;
}

export async function fetchProductDetailByUrlKeyGQL(
  url_key: string
): Promise<GQLProduct> {
  // 清理可能混入的非法字符（如 Next.js RSC 序列化引入的引号）
  const cleanUrlKey = url_key.replace(/["'`]/g, '').trim();
  
  const response = await magentoGraphQL<GQLProductsResponse>(
    PRODUCT_DETAIL_BY_URL_KEY_QUERY,
    { url_key: cleanUrlKey }
  );

  const item = response.products.items[0];
  if (!item) {
    throw new Error(`Product not found: ${cleanUrlKey}`);
  }

  return item;
}
