/** BFF 统一响应格式 */
export interface MagentoResponse<T> {
  success: boolean;
  data: T;
  error: MagentoErrorBody | null;
}

export interface MagentoErrorBody {
  code: string;
  message: string;
  details: unknown | null;
  request_id: string;
}

export interface CartMoney {
  value: number;
  currency: string;
}

export interface CartTotals {
  grand_total: CartMoney | null;
  grand_total_excluding_tax: CartMoney | null;
  subtotal_excluding_tax: CartMoney | null;
  subtotal_including_tax: CartMoney | null;
  discount: CartMoney | null;
  coupon_code?: string | null;
  discount_reason?: string | null;
}

export interface CartLineOption {
  label: string;
  value: string;
}

export interface CartItem {
  item_id: string;
  sku: string;
  qty: number;
  name: string;
  price: number;
  product_type: string;
  quote_id?: string;
  options?: CartLineOption[];
  enhanced_options?: CartLineOption[];
  row_total?: number;
  row_total_including_tax?: number;
  currency?: string;
  thumbnail?: string | null;
}

export interface CartItemsResponse {
  cart_id: string;
  items_count: number;
  total_quantity: number;
  items: CartItem[];
  totals: CartTotals | null;
  redirect_link?: string;
  link_expires_at?: string;
}

export interface AddCartItemParams {
  sku: string;
  qty: number;
  storeId?: number;
  productOptionsJson?: string;
}

export interface CartRedirectResponse {
  redirect_url: string;
}
