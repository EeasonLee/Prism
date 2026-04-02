import { magentoGraphQL } from './magento-graphql.client';

export interface GetProductsParams {
  categoryId?: number;
  page?: number;
  pageSize?: number;
  sort?: string;
}

interface GraphQLProduct {
  sku: string;
  name: string;
  url_key: string | null;
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

interface GraphQLProductsResponse {
  products: {
    items: GraphQLProduct[];
    total_count: number;
    page_info: {
      current_page: number;
      page_size: number;
      total_pages: number;
    };
  };
}

const PRODUCTS_QUERY = `
  query GetProducts(
    $categoryId: String
    $pageSize: Int
    $currentPage: Int
  ) {
    products(
      filter: { category_uid: { eq: $categoryId } }
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      items {
        sku
        name
        url_key
        price_range {
          minimum_price {
            final_price {
              value
            }
          }
        }
        thumbnail {
          url
        }
        stock_status
      }
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
    }
  }
`;

const PRODUCTS_QUERY_NO_FILTER = `
  query GetProducts(
    $pageSize: Int
    $currentPage: Int
  ) {
    products(
      search: ""
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      items {
        sku
        name
        url_key
        price_range {
          minimum_price {
            final_price {
              value
            }
          }
        }
        thumbnail {
          url
        }
        stock_status
      }
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
    }
  }
`;

export class ProductService {
  async getProducts(params: GetProductsParams) {
    // 如果有 categoryId，需要先获取 category uid
    const query = params.categoryId ? PRODUCTS_QUERY : PRODUCTS_QUERY_NO_FILTER;

    const variables: Record<string, unknown> = {
      pageSize: params.pageSize || 20,
      currentPage: params.page || 1,
    };

    if (params.categoryId) {
      // Magento GraphQL 需要 category_uid (base64)，不是 category_id
      // uid = base64(category_id)
      const uid = Buffer.from(String(params.categoryId)).toString('base64');
      variables.categoryId = uid;
    }

    const response = await magentoGraphQL<GraphQLProductsResponse>(
      query,
      variables
    );

    return {
      items: response.products.items,
      total_count: response.products.total_count,
      page_info: response.products.page_info,
    };
  }
}

export const productService = new ProductService();
