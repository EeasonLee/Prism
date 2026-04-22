'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  Address,
  AddressInput,
  Order,
  UpdateUserInput,
  User,
} from '@/lib/api/bff/account/types';
import { useAuth } from '@/lib/auth/context';

interface ErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

interface UseAccountResult {
  user: User | null;
  orders: Order[];
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (input: UpdateUserInput) => Promise<void>;
  addAddress: (input: AddressInput) => Promise<Address>;
  updateAddress: (id: number, input: AddressInput) => Promise<Address>;
  deleteAddress: (id: number) => Promise<void>;
  getCountries: () => Promise<Array<{ id: string; full_name_english: string }>>;
  getRegions: (countryCode: string) => Promise<Array<{ id: string; code: string; name: string }>>;
  logout: () => Promise<void>;
}

interface UseAccountOptions {
  loadUser?: boolean;
  loadOrders?: boolean;
  loadAddresses?: boolean;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ErrorPayload;
    return data.error?.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export function useAccount(options: UseAccountOptions = {}): UseAccountResult {
  const { loadUser = true, loadOrders = true, loadAddresses = true } = options;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (authLoading || !isAuthenticated) {
      setUser(null);
      setOrders([]);
      setAddresses([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requests: Promise<void>[] = [];

      if (loadUser) {
        requests.push(
          (async () => {
            const userRes = await fetch('/api/v1/account', {
              method: 'GET',
              credentials: 'include',
            });
            if (!userRes.ok) {
              throw new Error(await parseErrorMessage(userRes));
            }
            const userJson = (await userRes.json()) as { user: User };
            setUser(userJson.user ?? null);
          })()
        );
      }

      if (loadOrders) {
        requests.push(
          (async () => {
            const ordersRes = await fetch('/api/v1/account/orders', {
              method: 'GET',
              credentials: 'include',
            });
            if (!ordersRes.ok) {
              throw new Error(await parseErrorMessage(ordersRes));
            }
            const ordersJson = (await ordersRes.json()) as { orders: Order[] };
            setOrders(ordersJson.orders ?? []);
          })()
        );
      }

      if (loadAddresses) {
        requests.push(
          (async () => {
            const addressesRes = await fetch('/api/v1/account/addresses', {
              method: 'GET',
              credentials: 'include',
            });
            if (!addressesRes.ok) {
              throw new Error(await parseErrorMessage(addressesRes));
            }
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
  }, [authLoading, isAuthenticated, loadUser, loadOrders, loadAddresses]);

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
      const res = await fetch('/api/v1/account', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }

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
      throw new Error(await parseErrorMessage(res));
    }

    setUser(null);
    setOrders([]);
    setAddresses([]);
  }, []);

  const addAddress = useCallback(
    async (input: AddressInput) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      setError(null);
      const res = await fetch('/api/v1/account/addresses', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
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
      const res = await fetch(`/api/v1/account/addresses/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      const data = (await res.json()) as { address: Address };
      setAddresses(prev =>
        prev.map(a => (a.id === id ? data.address : a))
      );
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
      const res = await fetch(`/api/v1/account/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      setAddresses(prev => prev.filter(a => a.id !== id));
    },
    [isAuthenticated]
  );

  const getCountries = useCallback(async () => {
    const res = await fetch('/api/v1/account/addresses/countries', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const data = (await res.json()) as {
      countries: Array<{ id: string; full_name_english: string }>;
    };
    return data.countries ?? [];
  }, []);

  const getRegions = useCallback(async (countryCode: string) => {
    const res = await fetch(
      `/api/v1/account/addresses/regions?country=${encodeURIComponent(countryCode)}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const data = (await res.json()) as {
      regions: Array<{ id: string; code: string; name: string }>;
    };
    return data.regions ?? [];
  }, []);

  return {
    user,
    orders,
    addresses,
    isLoading,
    error,
    refresh,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    getCountries,
    getRegions,
    logout,
  };
}
