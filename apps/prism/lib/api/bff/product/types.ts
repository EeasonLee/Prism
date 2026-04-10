export interface ProductCardItem {
  sku: string;
  name: string;
  displayName: string;
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
