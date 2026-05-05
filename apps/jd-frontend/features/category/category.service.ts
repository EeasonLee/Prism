import { magentoGraphQL } from '@/core/api/clients/magento-graphql';
import { serverRequest } from '@/lib/api/adapters/server-adapter';

interface StrapiProductCategoryRow {
  id?: number;
  documentId?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  content?: string | null;
  magento_category_id?: number | null;
  list_image?: StrapiImageLike | null;
  background_image?: StrapiImageLike | null;
  children?: StrapiProductCategoryRow[];
}

interface StrapiImageLike {
  url?: string | null;
}

export interface GetCategoryTreeParams {
  rootId?: number;
  depth?: number;
}

export interface GetCategoryDetailParams {
  categoryId: number;
}

interface GraphQLCategoryTree {
  id: number;
  uid: string;
  name: string;
  url_key: string;
  url_path: string;
  level: number;
  position: number;
  product_count: number;
  children: GraphQLCategoryTree[];
}

interface GraphQLCategoryDetail {
  id: number;
  uid: string;
  name: string;
  url_key: string;
  description: string;
  image: string;
  product_count: number;
  breadcrumbs: Array<{
    category_id: number;
    category_name: string;
    category_level: number;
  }>;
}

const CATEGORY_TREE_QUERY = `
  query GetCategoryTree($id: String) {
    categoryList(filters: { ids: { eq: $id } }) {
      id
      uid
      name
      url_key
      url_path
      level
      position
      product_count
      children {
        id
        uid
        name
        url_key
        url_path
        level
        position
        product_count
        children {
          id
          uid
          name
          url_key
          url_path
          level
          position
          product_count
        }
      }
    }
  }
`;

const CATEGORY_BY_URL_KEY_QUERY = `
  query CategoryByUrlKey($urlKey: String!) {
    categoryList(filters: { url_key: { eq: $urlKey } }) {
      id
      name
      url_key
    }
  }
`;

const CATEGORY_DETAIL_QUERY = `
  query GetCategory($id: String!) {
    categoryList(filters: { ids: { eq: $id } }) {
      id
      uid
      name
      url_key
      description
      image
      product_count
      breadcrumbs {
        category_id
        category_name
        category_level
      }
    }
  }
`;

export class CategoryService {
  async getStrapiCategoriesByIds(categoryIds: number[]): Promise<
    Array<{
      id: number;
      name: string;
      slug?: string;
      description?: string | null;
      listImageUrl?: string | null;
      magentoCategoryId?: number | null;
    }>
  > {
    const normalizedIds = Array.from(
      new Set(
        categoryIds.filter(
          id => Number.isInteger(id) && Number.isFinite(id) && id > 0
        )
      )
    );

    if (normalizedIds.length === 0) {
      return [];
    }

    const query = [
      ...normalizedIds.map(
        (id, index) =>
          `filters[id][$in][${index}]=${encodeURIComponent(String(id))}`
      ),
      'fields[0]=name',
      'fields[1]=slug',
      'fields[2]=description',
      'fields[3]=magento_category_id',
      'populate[list_image]=true',
      `pagination[pageSize]=${normalizedIds.length}`,
    ].join('&');

    const response = await serverRequest(`api/product-categories?${query}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      data?: StrapiProductCategoryRow[];
    };
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const byId = new Map<number, StrapiProductCategoryRow>();

    for (const row of rows) {
      if (typeof row?.id === 'number') {
        byId.set(row.id, row);
      }
    }

    return normalizedIds
      .map(id => {
        const row = byId.get(id);
        if (!row?.id || !row.name) {
          return null;
        }

        return {
          id: row.id,
          name: row.name,
          slug: row.slug ?? undefined,
          description: row.description ?? null,
          listImageUrl: row.list_image?.url ?? null,
          magentoCategoryId: row.magento_category_id ?? null,
        };
      })
      .filter(
        (
          row
        ): row is {
          id: number;
          name: string;
          slug?: string;
          description?: string | null;
          listImageUrl?: string | null;
          magentoCategoryId?: number | null;
        } => Boolean(row)
      );
  }

  async getStrapiCategoryBasicBySlug(slug: string): Promise<{
    id: number;
    name: string;
    slug: string;
    content?: string | null;
    backgroundImageUrl?: string | null;
    magentoCategoryId?: number | null;
    children?: Array<{
      id: number;
      name: string;
      slug: string;
      imageUrl?: string | null;
    }>;
  } | null> {
    const trimmed = slug.trim();
    if (!trimmed) {
      return null;
    }

    const query = [
      `filters[slug][$eq]=${encodeURIComponent(trimmed)}`,
      'fields[0]=name',
      'fields[1]=slug',
      'fields[2]=content',
      'fields[3]=magento_category_id',
      'populate[list_image]=true',
      'populate[background_image]=true',
      'populate[children][fields][0]=name',
      'populate[children][fields][1]=slug',
      'populate[children][populate][list_image]=true',
      'populate[children][populate][background_image]=true',
      'pagination[pageSize]=1',
    ].join('&');

    const response = await serverRequest(`api/product-categories?${query}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      data?: StrapiProductCategoryRow[];
    };
    const row = payload.data?.[0];

    if (!row?.id || !row.name || !row.slug) {
      return null;
    }

    const pickImageUrl = (
      listImage?: StrapiImageLike | null,
      backgroundImage?: StrapiImageLike | null
    ): string | null => {
      const listImageUrl = listImage?.url;
      if (typeof listImageUrl === 'string' && listImageUrl.trim()) {
        return listImageUrl;
      }
      const backgroundImageUrl = backgroundImage?.url;
      if (typeof backgroundImageUrl === 'string' && backgroundImageUrl.trim()) {
        return backgroundImageUrl;
      }
      return null;
    };

    const children = Array.isArray(row.children)
      ? row.children
          .filter(child => Boolean(child?.id && child?.name && child?.slug))
          .map(child => ({
            id: child.id as number,
            name: child.name as string,
            slug: child.slug as string,
            imageUrl: pickImageUrl(child.list_image, child.background_image),
          }))
      : [];

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      content: row.content ?? null,
      backgroundImageUrl: row.background_image?.url ?? null,
      magentoCategoryId: row.magento_category_id ?? null,
      children,
    };
  }

  async getCategoryTree(
    params: GetCategoryTreeParams = {}
  ): Promise<GraphQLCategoryTree> {
    const response = await magentoGraphQL<{
      categoryList: GraphQLCategoryTree[];
    }>(CATEGORY_TREE_QUERY, {
      id: params.rootId?.toString(),
    });

    if (!response.categoryList || response.categoryList.length === 0) {
      throw new Error('Category tree not found');
    }

    return response.categoryList[0];
  }

  /**
   * 按 Magento 的 url_key 解析分类（不依赖浅层 children 树）。
   */
  async getCategoryByUrlKey(
    urlKey: string
  ): Promise<{ id: number; name: string; url_key: string } | null> {
    const trimmed = urlKey.trim();
    if (!trimmed) {
      return null;
    }

    const response = await magentoGraphQL<{
      categoryList: Array<{ id: number; name: string; url_key: string }>;
    }>(CATEGORY_BY_URL_KEY_QUERY, { urlKey: trimmed });

    const row = response.categoryList?.[0];
    if (!row?.url_key) {
      return null;
    }

    return row;
  }

  async getCategoryDetail(categoryId: number): Promise<GraphQLCategoryDetail> {
    const response = await magentoGraphQL<{
      categoryList: GraphQLCategoryDetail[];
    }>(CATEGORY_DETAIL_QUERY, {
      id: categoryId.toString(),
    });

    if (!response.categoryList || response.categoryList.length === 0) {
      throw new Error(`Category ${categoryId} not found`);
    }

    return response.categoryList[0];
  }
}

export const categoryService = new CategoryService();
