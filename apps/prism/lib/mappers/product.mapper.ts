export interface ProductListItem {
  sku: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
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
  sku: string;
  name: string;
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
