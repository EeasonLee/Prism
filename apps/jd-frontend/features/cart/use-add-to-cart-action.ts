'use client';

import { useCallback, useState } from 'react';
import type { AddCartItemParams } from '@/features/cart/types';
import { useCart } from './cart.context';

interface AddToCartActionOptions {
  openCartOnSuccess?: boolean;
  onSuccess?: () => void | Promise<void>;
  fallbackErrorMessage?: string;
}

type UseAddToCartActionOptions = AddToCartActionOptions;

interface UseAddToCartActionResult {
  isAdding: boolean;
  error: string | null;
  success: boolean;
  addItemToCart: (
    params: AddCartItemParams,
    options?: AddToCartActionOptions
  ) => Promise<boolean>;
  clearError: () => void;
  resetSuccess: () => void;
}

const DEFAULT_ERROR_MESSAGE = 'Failed to add item to cart. Please try again.';

export function useAddToCartAction(
  options?: UseAddToCartActionOptions
): UseAddToCartActionResult {
  const { addToCart, openCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  const addItemToCart = useCallback(
    async (
      params: AddCartItemParams,
      callOptions?: AddToCartActionOptions
    ): Promise<boolean> => {
      setError(null);
      setSuccess(false);
      setIsAdding(true);

      try {
        await addToCart(params);

        if (callOptions?.onSuccess) {
          await callOptions.onSuccess();
        } else if (options?.onSuccess) {
          await options.onSuccess();
        }

        if (callOptions?.openCartOnSuccess ?? options?.openCartOnSuccess) {
          openCart();
        }

        setSuccess(true);
        return true;
      } catch (_err) {
        setError(
          _err instanceof Error
            ? _err.message
            : callOptions?.fallbackErrorMessage ??
                options?.fallbackErrorMessage ??
                DEFAULT_ERROR_MESSAGE
        );
        return false;
      } finally {
        setIsAdding(false);
      }
    },
    [addToCart, openCart, options]
  );

  return {
    isAdding,
    error,
    success,
    addItemToCart,
    clearError,
    resetSuccess,
  };
}
