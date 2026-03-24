/**
 * Magento 商品目录查询（无需认证）
 */

import { magentoClient } from './client';
import type {
  FetchProductsParams,
  MagentoCategoryDetail,
  MagentoCategoryTree,
  MagentoConfigurableOption,
  MagentoDownloadableLink,
  MagentoDownloadableSample,
  MagentoGroupedItem,
  MagentoProduct,
  MagentoProductListResponse,
} from './types';

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    qs.append(key, String(value));
  });
  return qs.toString();
}

interface FetchCategoryTreeParams {
  rootId?: number;
  depth?: number;
  storeCode?: string;
}

interface FetchCategoryDetailParams {
  storeCode?: string;
}

interface FetchProductDetailParams {
  storeCode?: string;
}

type RawMoney = {
  value?: number | null;
  currency?: string | null;
};

type RawPriceRange = {
  minimum_price?: {
    regular_price?: RawMoney | null;
    final_price?: RawMoney | null;
  } | null;
} | null;

type RawCategoryRef = {
  id?: number | null;
  name?: string | null;
  level?: number | null;
};

type RawCategoryTree = {
  id?: number | null;
  uid?: string | null;
  name?: string | null;
  level?: number | null;
  url_path?: string | null;
  url_key?: string | null;
  position?: number | null;
  is_active?: boolean | null;
  product_count?: number | null;
  children?: RawCategoryTree[] | null;
};

type RawCategoryDetail = {
  id?: number | null;
  uid?: string | null;
  name?: string | null;
  level?: number | null;
  url_path?: string | null;
  url_key?: string | null;
  parent_id?: number | null;
  is_active?: boolean | null;
  position?: number | null;
  product_count?: number | null;
  description?: string | null;
  image_url?: string | null;
  path?: string | null;
  breadcrumbs?: Array<{
    category_id?: number | null;
    category_name?: string | null;
    category_level?: number | null;
  }> | null;
  children_ids?: Array<number | null> | null;
  cms_block?: {
    identifier?: string | null;
    title?: string | null;
    content?: string | null;
  } | null;
};

type RawConfigurableOption = {
  attribute_id?: number | null;
  attribute_code?: string | null;
  label?: string | null;
  position?: number | null;
  values?: Array<{
    value_index?: number | null;
    label?: string | null;
  }> | null;
};

type RawChildAttribute =
  | Array<{
      code?: string | null;
      label?: string | null;
      value?: string | null;
      value_index?: number | null;
    }>
  | Record<string, string | null>
  | null
  | undefined;

type RawMediaGalleryItem = {
  url?: string | null;
  label?: string | null;
  position?: number | null;
  media_type?: string | null;
};

type RawChildProduct = {
  id?: number | null;
  uid?: string | null;
  sku?: string | null;
  name?: string | null;
  price?: number | null;
  special_price?: number | null;
  stock_qty?: number | null;
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
  is_in_stock?: boolean | null;
  attributes?: RawChildAttribute;
  media_gallery?: RawMediaGalleryItem[] | null;
};

interface RawVariant {
  product?: {
    id?: number | null;
    uid?: string | null;
    sku?: string | null;
    name?: string | null;
    stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
    media_gallery?: RawMediaGalleryItem[] | null;
    price_range?: RawPriceRange;
  } | null;
  attributes?: RawChildAttribute;
}

type RawGroupedItem = {
  id?: number | null;
  sku?: string | null;
  name?: string | null;
  price?: number | null;
  special_price?: number | null;
  default_qty?: number | null;
  position?: number | null;
  stock_qty?: number | null;
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
  is_in_stock?: boolean | null;
  thumbnail_url?: string | null;
};

type RawBundleSelection = {
  selection_id?: number | null;
  sku?: string | null;
  name?: string | null;
  price?: number | null;
  price_type?: 'fixed' | 'percent' | null;
  default_qty?: number | null;
  is_default?: boolean | null;
  can_change_qty?: boolean | null;
  can_change_quantity?: boolean | null;
  stock_qty?: number | null;
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
  is_in_stock?: boolean | null;
};

type RawBundleOption = {
  option_id?: number | null;
  title?: string | null;
  required?: boolean | null;
  type?: 'select' | 'radio' | 'checkbox' | 'multi' | null;
  position?: number | null;
  selections?: RawBundleSelection[] | null;
};

type RawDownloadableLink = {
  id?: number | null;
  link_id?: number | null;
  title?: string | null;
  price?: number | null;
  sort_order?: number | null;
  number_of_downloads?: number | null;
  sample_url?: string | null;
};

type RawDownloadableSample = {
  id?: number | null;
  sample_id?: number | null;
  title?: string | null;
  sort_order?: number | null;
  sample_url?: string | null;
};

type RawMagentoProduct = {
  __typename?: string | null;
  id?: number | null;
  uid?: string | null;
  sku?: string | null;
  name?: string | null;
  description?: string | null;
  short_description?: string | null;
  price?: number | null;
  special_price?: number | null;
  type_id?: MagentoProduct['type_id'] | null;
  url_key?: string | null;
  price_range?: RawPriceRange;
  thumbnail?: {
    url?: string | null;
    label?: string | null;
  } | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  stock_qty?: number | null;
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
  is_in_stock?: boolean | null;
  rating?: number | null;
  rating_summary?: number | null;
  rating_percentage?: number | null;
  review_count?: number | null;
  category_ids?: Array<number | null> | null;
  categories?: RawCategoryRef[] | null;
  configurable_options?: RawConfigurableOption[] | null;
  children?: RawChildProduct[] | null;
  variants?: RawVariant[] | null;
  grouped_items?: RawGroupedItem[] | null;
  bundle_price_type?: 'fixed' | 'dynamic' | null;
  bundle_options?: RawBundleOption[] | null;
  links_purchased_separately?: boolean | number | null;
  downloadable_links?: RawDownloadableLink[] | null;
  downloadable_product_links?: RawDownloadableLink[] | null;
  downloadable_samples?: RawDownloadableSample[] | null;
  downloadable_product_samples?: RawDownloadableSample[] | null;
  media_gallery?: RawMediaGalleryItem[] | null;
  extra_attributes?: Record<string, unknown> | null;
};

type RawMagentoProductListResponse = {
  items?: RawMagentoProduct[] | null;
  total_count?: number | null;
  page_info?: {
    current_page?: number | null;
    page_size?: number | null;
    total_pages?: number | null;
  } | null;
};

function mapProductType(
  typename?: string | null,
  fallbackType?: MagentoProduct['type_id'] | null
): MagentoProduct['type_id'] {
  if (fallbackType) {
    return fallbackType;
  }

  switch (typename) {
    case 'ConfigurableProduct':
      return 'configurable';
    case 'VirtualProduct':
      return 'virtual';
    case 'BundleProduct':
      return 'bundle';
    case 'GroupedProduct':
      return 'grouped';
    case 'DownloadableProduct':
      return 'downloadable';
    default:
      return 'simple';
  }
}

function getPriceInfo(raw: RawMagentoProduct): {
  price: number;
  finalPrice: number;
  specialPrice: number | null;
  currency: string | null;
} {
  const regular =
    raw.price_range?.minimum_price?.regular_price?.value ?? raw.price ?? 0;
  const final =
    raw.price_range?.minimum_price?.final_price?.value ??
    raw.special_price ??
    regular;
  const specialPrice = final < regular ? final : null;
  const currency =
    raw.price_range?.minimum_price?.final_price?.currency ??
    raw.price_range?.minimum_price?.regular_price?.currency ??
    null;

  return {
    price: regular,
    finalPrice: final,
    specialPrice,
    currency,
  };
}

function normalizeCategoryTreeNode(raw: RawCategoryTree): MagentoCategoryTree {
  return {
    id: raw.id ?? 0,
    uid: raw.uid ?? null,
    name: raw.name ?? '',
    is_active: raw.is_active ?? true,
    position: raw.position ?? null,
    level: raw.level ?? 0,
    product_count: raw.product_count ?? 0,
    url_path: raw.url_path ?? null,
    url_key: raw.url_key ?? null,
    children: (raw.children ?? []).map(normalizeCategoryTreeNode),
  };
}

function normalizeCategoryDetail(
  raw: RawCategoryDetail
): MagentoCategoryDetail {
  return {
    id: raw.id ?? 0,
    uid: raw.uid ?? null,
    parent_id: raw.parent_id ?? null,
    name: raw.name ?? '',
    is_active: raw.is_active ?? true,
    position: raw.position ?? null,
    level: raw.level ?? 0,
    product_count: raw.product_count ?? 0,
    url_path: raw.url_path ?? null,
    url_key: raw.url_key ?? null,
    description: raw.description ?? null,
    image_url: raw.image_url ?? null,
    path: raw.path ?? null,
    breadcrumbs:
      raw.breadcrumbs?.map(item => ({
        category_id: item.category_id ?? 0,
        category_name: item.category_name ?? '',
        category_level: item.category_level ?? 0,
      })) ?? null,
    children_ids:
      raw.children_ids?.filter((id): id is number => typeof id === 'number') ??
      null,
    cms_block: raw.cms_block
      ? {
          identifier: raw.cms_block.identifier ?? '',
          title: raw.cms_block.title ?? '',
          content: raw.cms_block.content ?? '',
        }
      : null,
  };
}

function normalizeConfigurableOptions(
  options: RawConfigurableOption[] | null | undefined
): MagentoConfigurableOption[] {
  return (options ?? []).map(option => ({
    id: option.attribute_id ?? 0,
    attribute_id: String(option.attribute_id ?? ''),
    attribute_code: option.attribute_code ?? null,
    label: option.label ?? '',
    position: option.position ?? null,
    values: (option.values ?? []).map(value => ({
      value_index: value.value_index ?? 0,
      label: value.label ?? '',
    })),
  }));
}

function normalizeChildAttributes(
  attributes: RawChildAttribute
): Record<string, string> {
  if (Array.isArray(attributes)) {
    return attributes.reduce<Record<string, string>>((acc, item) => {
      if (!item.code) {
        return acc;
      }

      if (item.value_index != null) {
        acc[item.code] = String(item.value_index);
        return acc;
      }

      if (item.value != null) {
        acc[item.code] = item.value;
        return acc;
      }

      if (item.label != null) {
        acc[item.code] = item.label;
      }

      return acc;
    }, {});
  }

  if (!attributes) {
    return {};
  }

  return Object.entries(attributes).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value != null) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );
}

function normalizeChildren(
  raw: RawMagentoProduct,
  priceFallback: number
): MagentoProduct['children'] {
  const rawChildren = raw.children ?? [];
  if (rawChildren.length > 0) {
    return rawChildren.map(child => ({
      id: child.id ?? 0,
      uid: child.uid ?? null,
      sku: child.sku ?? '',
      name: child.name ?? '',
      price: child.price ?? priceFallback,
      special_price: child.special_price ?? null,
      stock_qty: child.stock_qty ?? null,
      stock_status: child.stock_status ?? null,
      is_in_stock:
        child.is_in_stock ??
        (child.stock_status ? child.stock_status === 'IN_STOCK' : true),
      attributes: normalizeChildAttributes(child.attributes),
      media_gallery: normalizeMediaGallery(child.media_gallery),
    }));
  }

  return (raw.variants ?? []).map(variant => ({
    id: variant.product?.id ?? 0,
    uid: variant.product?.uid ?? null,
    sku: variant.product?.sku ?? '',
    name: variant.product?.name ?? '',
    price:
      variant.product?.price_range?.minimum_price?.final_price?.value ??
      priceFallback,
    special_price: null,
    stock_qty: null,
    stock_status: variant.product?.stock_status ?? null,
    is_in_stock: variant.product?.stock_status === 'IN_STOCK',
    attributes: normalizeChildAttributes(variant.attributes),
    media_gallery: normalizeMediaGallery(variant.product?.media_gallery),
  }));
}

function normalizeMediaGallery(
  items: RawMediaGalleryItem[] | null | undefined
) {
  return (items ?? []).map(item => ({
    url: item.url ?? '',
    label: item.label ?? null,
    position: item.position ?? 0,
    media_type: item.media_type ?? null,
  }));
}

function normalizeGroupedItems(
  items: RawGroupedItem[] | null | undefined
): MagentoGroupedItem[] {
  return (items ?? []).map(item => ({
    id: item.id ?? 0,
    sku: item.sku ?? '',
    name: item.name ?? '',
    price: item.price ?? 0,
    special_price: item.special_price ?? null,
    default_qty: item.default_qty ?? 1,
    position: item.position ?? null,
    stock_qty: item.stock_qty ?? null,
    stock_status: item.stock_status ?? null,
    is_in_stock:
      item.is_in_stock ??
      (item.stock_status ? item.stock_status === 'IN_STOCK' : true),
    thumbnail_url: item.thumbnail_url ?? null,
  }));
}

function normalizeDownloadableLinks(
  items: RawDownloadableLink[] | null | undefined
): MagentoDownloadableLink[] {
  return (items ?? []).map(item => ({
    link_id: item.link_id ?? item.id ?? 0,
    title: item.title ?? '',
    price: item.price ?? 0,
    sort_order: item.sort_order ?? 0,
    number_of_downloads: item.number_of_downloads ?? null,
    sample_url: item.sample_url ?? null,
  }));
}

function normalizeDownloadableSamples(
  items: RawDownloadableSample[] | null | undefined
): MagentoDownloadableSample[] {
  return (items ?? []).map(item => ({
    sample_id: item.sample_id ?? item.id ?? 0,
    title: item.title ?? '',
    sort_order: item.sort_order ?? 0,
    sample_url: item.sample_url ?? '',
  }));
}

function normalizeProduct(raw: RawMagentoProduct): MagentoProduct {
  const { price, finalPrice, specialPrice, currency } = getPriceInfo(raw);
  const thumbnailUrl =
    raw.thumbnail?.url ??
    raw.thumbnail_url ??
    raw.image_url ??
    raw.media_gallery?.[0]?.url ??
    null;
  const ratingPercentage =
    raw.rating_summary ??
    raw.rating_percentage ??
    (raw.rating != null ? raw.rating * 20 : null);
  const categories = (raw.categories ?? []).reduce<
    Array<{ id: number; name: string; level: number }>
  >((acc, category) => {
    if (
      category.id != null &&
      category.name != null &&
      category.level != null
    ) {
      acc.push({
        id: category.id,
        name: category.name,
        level: category.level,
      });
    }
    return acc;
  }, []);
  const typeId = mapProductType(raw.__typename, raw.type_id);

  return {
    id: raw.id ?? 0,
    __typename: raw.__typename ?? null,
    uid: raw.uid ?? null,
    sku: raw.sku ?? '',
    name: raw.name ?? '',
    price,
    currency,
    type_id: typeId,
    url_key: raw.url_key ?? null,
    thumbnail_url: thumbnailUrl,
    image_url: thumbnailUrl,
    final_price: finalPrice,
    special_price: specialPrice,
    stock_qty: raw.stock_qty ?? null,
    stock_status: raw.stock_status ?? null,
    is_in_stock:
      raw.is_in_stock ??
      (raw.stock_status ? raw.stock_status === 'IN_STOCK' : undefined),
    rating:
      ratingPercentage != null ? ratingPercentage / 20 : raw.rating ?? null,
    rating_percentage: ratingPercentage ?? null,
    review_count: raw.review_count ?? 0,
    has_reviews: (raw.review_count ?? 0) > 0,
    category_ids:
      raw.category_ids?.filter((id): id is number => typeof id === 'number') ??
      categories.map(category => category.id),
    categories,
    configurable_options: normalizeConfigurableOptions(
      raw.configurable_options
    ),
    children: normalizeChildren(raw, finalPrice),
    grouped_items: normalizeGroupedItems(raw.grouped_items),
    bundle_price_type: raw.bundle_price_type ?? undefined,
    bundle_options: (raw.bundle_options ?? []).map(option => ({
      option_id: option.option_id ?? 0,
      title: option.title ?? '',
      required: option.required ?? false,
      type: option.type ?? 'select',
      position: option.position ?? 0,
      selections: (option.selections ?? []).map(selection => ({
        selection_id: selection.selection_id ?? 0,
        sku: selection.sku ?? '',
        name: selection.name ?? '',
        price: selection.price ?? 0,
        price_type: selection.price_type ?? 'fixed',
        default_qty: selection.default_qty ?? 1,
        is_default: selection.is_default ?? false,
        can_change_qty:
          selection.can_change_qty ?? selection.can_change_quantity ?? false,
        stock_qty: selection.stock_qty ?? null,
        stock_status: selection.stock_status ?? null,
        is_in_stock:
          selection.is_in_stock ??
          (selection.stock_status
            ? selection.stock_status === 'IN_STOCK'
            : true),
      })),
    })),
    links_purchased_separately:
      raw.links_purchased_separately === true ||
      raw.links_purchased_separately === 1,
    downloadable_links: normalizeDownloadableLinks(
      raw.downloadable_links ?? raw.downloadable_product_links
    ),
    downloadable_samples: normalizeDownloadableSamples(
      raw.downloadable_samples ?? raw.downloadable_product_samples
    ),
    media_gallery: normalizeMediaGallery(raw.media_gallery),
    description: raw.description ?? null,
    short_description: raw.short_description ?? null,
    extra_attributes: raw.extra_attributes ?? null,
  };
}

/** 获取完整分类树 */
export async function fetchCategoryTree(
  params: FetchCategoryTreeParams = {}
): Promise<MagentoCategoryTree> {
  const qs = buildQuery({
    rootId: params.rootId,
    depth: params.depth,
    storeCode: params.storeCode,
  });

  const response = await magentoClient.get<RawCategoryTree>(
    `/api/categories/tree${qs ? `?${qs}` : ''}`
  );

  return normalizeCategoryTreeNode(response);
}

/** 获取单个分类详情 */
export async function fetchCategoryById(
  categoryId: number,
  params: FetchCategoryDetailParams = {}
): Promise<MagentoCategoryDetail> {
  const qs = buildQuery({
    storeCode: params.storeCode,
  });

  const response = await magentoClient.get<RawCategoryDetail>(
    `/api/categories/${categoryId}${qs ? `?${qs}` : ''}`
  );

  return normalizeCategoryDetail(response);
}

/** 获取商品列表（支持分类筛选、关键词搜索、分页） */
export async function fetchProducts(
  params: FetchProductsParams = {}
): Promise<MagentoProductListResponse> {
  const qs = buildQuery({
    categoryId: params.categoryId,
    keyword: params.keyword,
    skus: params.skus,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    storeCode: params.storeCode || 'default',
    // sort: params.sort,
    // order: params.order ?? 'desc',
  });

  const response = await magentoClient.get<RawMagentoProductListResponse>(
    `/api/products${qs ? `?${qs}` : ''}`
  );

  return {
    items: (response.items ?? []).map(normalizeProduct),
    total_count: response.total_count ?? 0,
    page_info: {
      current_page: response.page_info?.current_page ?? params.page ?? 1,
      page_size: response.page_info?.page_size ?? params.pageSize ?? 20,
      total_pages: response.page_info?.total_pages ?? 1,
    },
  };
}

/** 根据 SKU 获取商品详情 */
export async function fetchProductBySku(
  sku: string,
  params: FetchProductDetailParams = {}
): Promise<MagentoProduct> {
  const qs = buildQuery({
    storeCode: params.storeCode,
  });

  const response = await magentoClient.get<RawMagentoProduct>(
    `/api/products/${encodeURIComponent(sku)}${qs ? `?${qs}` : ''}`
  );

  return normalizeProduct(response);
}
