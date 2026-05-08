'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Address,
  AddressInput,
  ChangePasswordInput,
  Order,
  UpdateUserInput,
  User,
  WishlistItem,
} from './types';
import { useAuth } from '@/features/auth';

interface ErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

interface ParsedError {
  code?: string;
  message: string;
}

interface UseAccountResult {
  user: User | null;
  orders: Order[];
  addresses: Address[];
  wishlist: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (input: UpdateUserInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  deleteAccount: () => Promise<void>;
  addAddress: (input: AddressInput) => Promise<Address>;
  updateAddress: (id: number, input: AddressInput) => Promise<Address>;
  deleteAddress: (id: number) => Promise<void>;
  getDefaultAddresses: () => Promise<{
    billing: Address | null;
    shipping: Address | null;
  }>;
  getCountries: () => Promise<Array<{ id: string; full_name_english: string }>>;
  getRegions: (
    countryCode: string
  ) => Promise<Array<{ id: string; code: string; name: string }>>;
  revalidateCountries: () => Promise<void>;
  logout: () => Promise<void>;
  getWishlist: () => Promise<WishlistItem[]>;
  addToWishlist: (sku: string) => Promise<void>;
  removeFromWishlist: (id: number) => Promise<void>;
}
interface UseAccountOptions {
  loadUser?: boolean;
  loadOrders?: boolean;
  loadAddresses?: boolean;
}

async function parseError(response: Response): Promise<ParsedError> {
  try {
    const data = (await response.json()) as ErrorPayload;
    return {
      code: data.error?.code,
      message: data.error?.message ?? 'Request failed',
    };
  } catch {
    return { message: 'Request failed' };
  }
}

async function fetchWithSessionRecovery(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.ok) return res;

  const parsed = await parseError(res);
  const method = (init?.method ?? 'GET').toUpperCase();
  if (parsed.code !== 'UPSTREAM_UNAUTHORIZED') {
    throw new Error(parsed.message);
  }
  if (method !== 'GET') {
    throw new Error(parsed.message);
  }

  // 仅在 Magento 上游 token 不接受时，尝试刷新一次本地 session 后重试
  const sessionRes = await fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include',
  });
  if (!sessionRes.ok) {
    throw new Error(parsed.message);
  }

  const retried = await fetch(input, init);
  if (!retried.ok) {
    const retriedParsed = await parseError(retried);
    throw new Error(retriedParsed.message);
  }

  return retried;
}

export function useAccount(options: UseAccountOptions = {}): UseAccountResult {
  const { loadUser = true, loadOrders = true, loadAddresses = true } = options;
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionWarmupDoneRef = useRef(false);

  const refresh = useCallback(async () => {
    if (authLoading || !isAuthenticated) {
      setUser(null);
      setOrders([]);
      setAddresses([]);
      setWishlist([]);
      setError(null);
      setIsLoading(false);
      sessionWarmupDoneRef.current = false;
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!sessionWarmupDoneRef.current) {
        // 首次进入 account 区域时先刷新一次 session，减少首个接口 401+重试
        await refreshSession().catch(() => void 0);
        sessionWarmupDoneRef.current = true;
      }

      const requests: Promise<void>[] = [];

      if (loadUser) {
        requests.push(
          (async () => {
            const userRes = await fetchWithSessionRecovery('/api/v1/account', {
              method: 'GET',
              credentials: 'include',
            });
            const userJson = (await userRes.json()) as { user: User };
            setUser(userJson.user ?? null);
          })()
        );
      }

      if (loadOrders) {
        requests.push(
          (async () => {
            const ordersRes = await fetchWithSessionRecovery(
              '/api/v1/account/orders',
              {
                method: 'GET',
                credentials: 'include',
              }
            );
            const ordersJson = (await ordersRes.json()) as { orders: Order[] };
            setOrders(ordersJson.orders ?? []);
          })()
        );
      }

      if (loadAddresses) {
        requests.push(
          (async () => {
            const addressesRes = await fetchWithSessionRecovery(
              '/api/v1/account/addresses',
              {
                method: 'GET',
                credentials: 'include',
              }
            );
            const addressesJson = (await addressesRes.json()) as {
              addresses: Address[];
            };
            setAddresses(addressesJson.addresses ?? []);
          })()
        );
      }

      await Promise.all(requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setIsLoading(false);
    }
  }, [
    authLoading,
    isAuthenticated,
    loadUser,
    loadOrders,
    loadAddresses,
    refreshSession,
  ]);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    void refresh();
  }, [authLoading, refresh]);

  const updateProfile = useCallback(
    async (input: UpdateUserInput) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      setError(null);
      const res = await fetchWithSessionRecovery('/api/v1/account', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const data = (await res.json()) as { user: User };
      setUser(data.user);
    },
    [isAuthenticated]
  );

  const logout = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/v1/account/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      const parsed = await parseError(res);
      throw new Error(parsed.message);
    }

    setUser(null);
    setOrders([]);
    setAddresses([]);
  }, []);

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      setError(null);
      const res = await fetchWithSessionRecovery('/api/v1/account/password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const parsed = await parseError(res);
        throw new Error(parsed.message);
      }
    },
    [isAuthenticated]
  );

  const deleteAccount = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }
    setError(null);
    const res = await fetchWithSessionRecovery('/api/v1/account', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const parsed = await parseError(res);
      throw new Error(parsed.message);
    }

    setUser(null);
    setOrders([]);
    setAddresses([]);
  }, [isAuthenticated]);

  const addAddress = useCallback(
    async (input: AddressInput) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      setError(null);
      const res = await fetchWithSessionRecovery('/api/v1/account/addresses', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as { address: Address };
      setAddresses(prev => [...prev, data.address]);
      return data.address;
    },
    [isAuthenticated]
  );

  const updateAddress = useCallback(
    async (id: number, input: AddressInput) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      setError(null);
      const res = await fetchWithSessionRecovery(
        `/api/v1/account/addresses/${id}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = (await res.json()) as { address: Address };
      setAddresses(prev => prev.map(a => (a.id === id ? data.address : a)));
      return data.address;
    },
    [isAuthenticated]
  );

  const deleteAddress = useCallback(
    async (id: number) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      setError(null);
      await fetchWithSessionRecovery(`/api/v1/account/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setAddresses(prev => prev.filter(a => a.id !== id));
    },
    [isAuthenticated]
  );

  const getCountries = useCallback(async () => {
    const res = await fetchWithSessionRecovery(
      '/api/v1/account/addresses/countries',
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const data = (await res.json()) as {
      countries: Array<{ id: string; full_name_english: string }>;
    };
    return data.countries ?? [];
  }, []);

  const getRegions = useCallback(async (countryCode: string) => {
    const res = await fetchWithSessionRecovery(
      `/api/v1/account/addresses/regions?country=${encodeURIComponent(
        countryCode
      )}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const data = (await res.json()) as {
      regions: Array<{ id: string; code: string; name: string }>;
    };
    return data.regions ?? [];
  }, []);

  const revalidateCountries = useCallback(async () => {
    const res = await fetchWithSessionRecovery(
      '/api/v1/account/addresses/revalidate',
      {
        method: 'POST',
        credentials: 'include',
      }
    );
    if (!res.ok) {
      const parsed = await parseError(res);
      throw new Error(parsed.message);
    }
  }, []);

  const getDefaultAddresses = useCallback(async () => {
    const res = await fetchWithSessionRecovery(
      '/api/v1/account/addresses/default',
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const data = (await res.json()) as {
      billing: Address | null;
      shipping: Address | null;
    };
    return data;
  }, []);

  const getWishlist = useCallback(async () => {
    const res = await fetchWithSessionRecovery('/api/v1/account/wishlist', {
      method: 'GET',
      credentials: 'include',
    });
    const data = (await res.json()) as { items: WishlistItem[] };
    setWishlist(data.items ?? []);
    return data.items ?? [];
  }, []);

  const addToWishlist = useCallback(
    async (sku: string) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      setError(null);
      const res = await fetchWithSessionRecovery('/api/v1/account/wishlist', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku }),
      });
      if (!res.ok) {
        const parsed = await parseError(res);
        throw new Error(parsed.message);
      }
      // Refresh wishlist after adding
      await getWishlist();
    },
    [isAuthenticated, getWishlist]
  );

  const removeFromWishlist = useCallback(
    async (id: number) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      setError(null);
      await fetchWithSessionRecovery(`/api/v1/account/wishlist/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setWishlist(prev => prev.filter(item => item.id !== id));
    },
    [isAuthenticated]
  );

  return {
    user,
    orders,
    addresses,
    wishlist,
    isLoading,
    error,
    refresh,
    updateProfile,
    changePassword,
    deleteAccount,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddresses,
    getCountries,
    getRegions,
    revalidateCountries,
    logout,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
  };
}
