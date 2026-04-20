import { magentoGraphQL } from './magento-graphql.client';

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
