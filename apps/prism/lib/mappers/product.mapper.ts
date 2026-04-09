export interface ProductListItem {
  sku: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
  url_key: string | null;
  type_id: 'simple' | 'configurable';
}

export interface ProductListResponse {
  items: ProductListItem[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
}

interface GraphQLProduct {
  __typename?: string;
  sku: string;
  name: string;
  url_key?: string | null;
  price_range: {
    minimum_price: {
      final_price: {
        value: number;
      };
    };
  };
  thumbnail: {
    url: string;
  };
  stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
}

export function mapProductListItem(raw: GraphQLProduct): ProductListItem {
  return {
    sku: raw.sku,
    name: raw.name,
    price: raw.price_range.minimum_price.final_price.value,
    image: raw.thumbnail?.url || '',
    inStock: raw.stock_status === 'IN_STOCK',
    url_key: raw.url_key ?? null,
    type_id:
      raw.__typename === 'ConfigurableProduct' ? 'configurable' : 'simple',
  };
}

export function mapProductList(
  items: GraphQLProduct[],
  page: number,
  total: number,
  totalPages: number
): ProductListResponse {
  return {
    items: items.map(mapProductListItem),
    pagination: { page, total, totalPages },
  };
}

// Product detail types (GraphQL)
interface MagentoProductDetail {
  __typename: string;
  id: number;
  sku: string;
  name: string;
  description: { html: string } | null;
  short_description: { html: string } | null;
  price_range: {
    minimum_price: {
      regular_price: { value: number; currency: string };
      final_price: { value: number; currency: string };
    };
  };
  media_gallery: Array<{ url: string; position: number; disabled: boolean }>;
  thumbnail: { url: string } | null;
  stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
  rating_summary: number;
  review_count: number;
  categories: Array<{
    id: number;
    name: string;
    url_key: string | null;
    url_path: string | null;
  }>;
  configurable_options: Array<{
    attribute_code: string;
    label: string;
    values: Array<{ value_index: number; label: string }>;
  }> | null;
  variants: Array<{
    product: {
      sku: string;
      cp_label: string | null;
      cp_code: string | null;
      cp_date: string | null;
      cp_price: number | null;
      stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
      price_range: {
        minimum_price: {
          final_price: { value: number };
        };
      };
    };
    attributes: Array<{ code: string; value_index: number }>;
  }> | null;
}

export interface ProductDetail {
  id: number;
  sku: string;
  name: string;
  price: number;
  originalPrice: number;
  currency: string;
  price_range?: { minimum_price?: { final_price?: { value: number } } };
  description: string;
  shortDescription: string;
  images: string[];
  thumbnail: string;
  inStock: boolean;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK';
  rating: number;
  reviewCount: number;
  categories: Array<{
    id: number;
    name: string;
    url_key: string | null;
    url_path: string | null;
  }>;
  isConfigurable: boolean;
}

export function mapProductDetail(raw: MagentoProductDetail): ProductDetail {
  const regularPrice = raw.price_range.minimum_price.regular_price.value;
  const finalPrice = raw.price_range.minimum_price.final_price.value;
  const currency = raw.price_range.minimum_price.final_price.currency;

  const images = raw.media_gallery
    .filter(item => !item.disabled)
    .sort((a, b) => a.position - b.position)
    .map(item => item.url);
  const thumbnail = raw.thumbnail?.url ?? images[0] ?? '';

  return {
    id: raw.id,
    sku: raw.sku,
    name: raw.name,
    price: finalPrice,
    originalPrice: regularPrice,
    currency,
    price_range: {
      minimum_price: {
        final_price: { value: finalPrice },
      },
    },
    description: raw.description?.html ?? '',
    shortDescription: raw.short_description?.html ?? '',
    images,
    thumbnail,
    inStock: raw.stock_status === 'IN_STOCK',
    stockStatus: raw.stock_status,
    rating: raw.rating_summary / 20,
    reviewCount: raw.review_count,
    categories: raw.categories,
    isConfigurable: raw.__typename === 'ConfigurableProduct',
  };
}

export interface ProductVariant {
  sku: string;
  attributes: Record<string, string>;
  cp_label: string | null;
  cp_code: string | null;
  cp_date: string | null;
  cp_price: number | null;
  price: number;
  inStock: boolean;
}

export interface ProductVariantsResponse {
  options: Array<{
    code: string;
    label: string;
    values: Array<{ label: string; value: string }>;
  }>;
  variants: ProductVariant[];
}

export function mapProductVariants(
  raw: MagentoProductDetail
): ProductVariantsResponse {
  const options = (raw.configurable_options ?? []).map(opt => ({
    code: opt.attribute_code,
    label: opt.label,
    values: opt.values.map(v => ({
      label: v.label,
      value: String(v.value_index),
    })),
  }));

  const variants = (raw.variants ?? []).map(v => {
    const attributes = v.attributes.reduce<Record<string, string>>(
      (acc, attr) => {
        acc[attr.code] = String(attr.value_index);
        return acc;
      },
      {}
    );
    return {
      sku: v.product.sku,
      attributes,
      cp_label: v.product.cp_label ?? null,
      cp_code: v.product.cp_code ?? null,
      cp_date: v.product.cp_date ?? null,
      cp_price: v.product.cp_price ?? null,
      price: v.product.price_range.minimum_price.final_price.value,
      inStock: v.product.stock_status === 'IN_STOCK',
    };
  });

  return { options, variants };
}
