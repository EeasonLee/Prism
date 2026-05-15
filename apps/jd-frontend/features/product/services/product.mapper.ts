import { resolveImageUrl } from '@/infrastructure/config/image';

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
  const imageUrl =
    resolveImageUrl(raw.thumbnail?.url) ?? raw.thumbnail?.url ?? '';

  return {
    sku: raw.sku,
    name: raw.name,
    price: raw.price_range.minimum_price.final_price.value,
    image: imageUrl,
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
    attribute_id: number;
    attribute_code: string;
    label: string;
    values: Array<{ value_index: number; label: string }>;
  }> | null;
  options?: Array<{
    option_id: number;
    title: string;
    required: boolean;
    type?: string;
    __typename?: string;
    values?: Array<{
      option_type_id: number;
      title: string;
      price?: number;
      price_type?: string;
    }>;
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
    .map(item => resolveImageUrl(item.url) ?? item.url);
  const thumbnail =
    resolveImageUrl(raw.thumbnail?.url ?? images[0]) ??
    raw.thumbnail?.url ??
    images[0] ??
    '';

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
    values?: Array<{ option_type_id: number; title: string; sku?: string | null; price: number }>;
  }>;
  variants: ProductVariant[];
}

export function mapProductVariants(
  raw: MagentoProductDetail
): ProductVariantsResponse {
  const options = (raw.configurable_options ?? []).map(opt => ({
    attribute_id: Number(opt.attribute_id),
    code: opt.attribute_code,
    label: opt.label,
    values: opt.values.map(v => ({
      label: v.label,
      value: String(v.value_index),
    })),
  }));

  const customizable_options = (raw.options ?? []).map(opt => {
    const derivedType =
      opt.type ||
      (opt.__typename
        ? opt.__typename
            .replace('Customizable', '')
            .replace('Option', '')
            .toLowerCase()
            .replace('dropdown', 'drop_down')
        : '');

    const optRecord = opt as unknown as Record<string, unknown>;
    const selectionValue =
      optRecord.dropdownValue ??
      optRecord.drop_down_value ??
      optRecord.radioValue ??
      optRecord.radio_value ??
      optRecord.checkboxValue ??
      optRecord.checkbox_value ??
      optRecord.multipleValue ??
      optRecord.multiple_value ??
      null;

    const values = Array.isArray(selectionValue)
      ? (
          selectionValue as Array<{
            option_type_id: number;
            title: string;
            sku?: string | null;
            price?: number;
          }>
        ).map(v => ({
          option_type_id: v.option_type_id,
          title: v.title,
          sku: v.sku ?? null,
          price: (v as { price?: number }).price ?? 0,
        }))
      : undefined;

    return {
      option_id: opt.option_id,
      title: opt.title,
      required: opt.required,
      type: derivedType,
      values,
    };
  });

  const variants = (raw.variants ?? []).map(v => {
    const attributes = v.attributes.reduce<Record<string, string>>(
      (acc, attr) => {
        acc[attr.code] = String(attr.value_index);
        const matchingOption = raw.configurable_options?.find(
          opt => opt.attribute_code === attr.code
        );
        if (matchingOption) {
          acc[String(matchingOption.attribute_id)] = String(attr.value_index);
        }
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

  return { options, customizable_options, variants };
}
