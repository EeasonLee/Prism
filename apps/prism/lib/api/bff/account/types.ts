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

export interface Address {
  id: number;
  firstname: string;
  lastname: string;
  street: string;
  city: string;
  country: string;
}

export interface AccountErrorShape {
  error: {
    code: string;
    message: string;
  };
}
