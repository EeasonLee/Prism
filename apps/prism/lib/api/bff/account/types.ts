export interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
}

export interface UpdateUserInput {
  email?: string;
  firstname?: string;
  lastname?: string;
}

export interface Order {
  id: number;
  number: string;
  status: string;
  total: number;
  currency: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderAddress {
  firstname: string;
  lastname: string;
  street: string;
  city: string;
  region?: string;
  postcode?: string;
  country: string;
  telephone?: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  billingAddress: OrderAddress;
  shippingAddress: OrderAddress;
  shippingMethod: string;
  paymentMethod: string;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
}

export interface Address {
  id: number;
  firstname: string;
  lastname: string;
  street: string;
  city: string;
  region: string;
  regionId?: number;
  postcode: string;
  country: string;
  telephone: string;
  defaultBilling: boolean;
  defaultShipping: boolean;
}

export interface AddressInput {
  firstname: string;
  lastname: string;
  street: string[];
  city: string;
  region?: {
    region?: string;
    region_code?: string;
    region_id?: number;
  };
  postcode: string;
  country_code: string;
  telephone: string;
  default_billing?: boolean;
  default_shipping?: boolean;
}

export interface AccountErrorShape {
  error: {
    code: string;
    message: string;
  };
}
