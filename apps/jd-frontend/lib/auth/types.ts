import type { AuthTokens, AuthUser } from '@/lib/api/magento/types';

export type { AuthTokens, AuthUser };

export interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  guestId: string | null;
  hasSession: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
}

export interface SessionResponse {
  hasSession: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  user?: AuthUser;
}

export interface LocalSessionTokenPayload {
  sub: string;
  type: 'customer' | 'guest';
  magentoAccessToken: string;
  guestId?: string;
  customerEmail?: string;
  exp: number;
  iat: number;
}

export interface LocalRefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: 'customer' | 'guest';
  guestId?: string;
  magentoAccessToken: string;
  magentoRefreshToken?: string;
  customerEmail?: string;
  exp: number;
  iat: number;
}

export interface LocalSessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CheckoutRedirectTokenPayload {
  type: 'checkout_redirect' | 'cart_redirect';
  mode: 'guest' | 'customer';
  returnTo: 'checkout' | 'cart';
  guestId?: string;
  customerEmail?: string;
  magentoAccessToken?: string;
  sessionAccessToken?: string;
  exp: number;
  iat: number;
}

export interface AuthProviderUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthProviderLoginResult {
  user: AuthProviderUser;
  magentoAccessToken: string;
  magentoRefreshToken?: string;
  guestId?: string;
  cartMergeStatus?: string;
}

export interface AuthProviderGuestSessionResult {
  guestId: string;
  magentoAccessToken: string;
  magentoRefreshToken?: string;
}
