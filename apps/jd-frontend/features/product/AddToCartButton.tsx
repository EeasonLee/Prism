'use client';

import { ShoppingCart } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useAddToCartAction } from '@/features/cart/use-add-to-cart-action';

interface AddToCartButtonProps {
  sku: string;
  qty?: number;
  storeId?: number;
  /** 正常状态下按钮文案 */
  label?: string;
  /** 由外部（ProductDetailClient）按产品类型构建好的 JSON 字符串 */
  productOptionsJson?: string;
  /** 按钮是否禁用（如 configurable 未选完属性） */
  disabled?: boolean;
  /** 禁用时的按钮文字 */
  disabledLabel?: string;
  className?: string;
}

export function AddToCartButton({
  sku,
  qty = 1,
  storeId = 1,
  label = 'Add to Cart',
  productOptionsJson,
  disabled: externalDisabled = false,
  disabledLabel = 'Select Options',
  className,
}: AddToCartButtonProps) {
  const { addItemToCart, isAdding, error, success, resetSuccess } =
    useAddToCartAction();

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => resetSuccess(), 3000);
    return () => window.clearTimeout(timer);
  }, [resetSuccess, success]);

  const handleAddToCart = useCallback(async () => {
    await addItemToCart(
      { sku, qty, storeId, productOptionsJson },
      { openCartOnSuccess: true }
    );
  }, [addItemToCart, productOptionsJson, qty, sku, storeId]);

  const isDisabled = isAdding || externalDisabled;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isDisabled}
        className={
          className ??
          'btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50'
        }
      >
        <ShoppingCart className="h-4 w-4" />
        {isAdding
          ? 'Adding…'
          : success
          ? 'Added!'
          : externalDisabled
          ? disabledLabel
          : label}
      </button>

      {error && (
        <p role="alert" className="text-center text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
