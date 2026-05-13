'use client';

import { useCallback, useState } from 'react';
import type { AddCartItemParams } from '../types';
import { useCart } from '../components/cart.context';

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

/** 清理 API 错误消息，移除堆栈跟踪等技术信息 */
function sanitizeErrorMessage(message: string): string {
  if (!message) return DEFAULT_ERROR_MESSAGE;

  // 尝试解析 JSON 错误响应（Magento 常返回 { message: "...", trace: "..." }）
  if (message.includes('"message"') || message.includes('"trace"')) {
    try {
      const parsed = JSON.parse(message);
      // 优先使用 error.message 或 message 字段
      if (parsed.error?.message) {
        return parsed.error.message;
      }
      if (parsed.message) {
        return parsed.message;
      }
    } catch {
      // 不是合法 JSON，继续处理
    }
  }

  // 处理常见的库存错误
  if (message.includes('The requested qty is not available')) {
    return 'The requested quantity is not available. Please check the stock status.';
  }

  // 处理其他常见错误
  if (message.includes('No active session')) {
    return 'Please sign in or refresh the page to continue.';
  }

  // 如果消息太长，截断它
  if (message.length > 200) {
    return message.substring(0, 200) + '...';
  }

  return message;
}

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
        const rawMessage =
          _err instanceof Error
            ? _err.message
            : callOptions?.fallbackErrorMessage ??
              options?.fallbackErrorMessage ??
              DEFAULT_ERROR_MESSAGE;
        setError(sanitizeErrorMessage(rawMessage));
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
