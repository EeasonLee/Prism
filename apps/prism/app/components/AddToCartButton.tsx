'use client';

import { ShoppingCart } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useCart } from '../../lib/cart/context';

interface AddToCartButtonProps {
  sku: string;
  qty?: number;
  storeId?: number;
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
  productOptionsJson,
  disabled: externalDisabled = false,
  disabledLabel = 'Select Options',
  className,
}: AddToCartButtonProps) {
  const { addToCart, openCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddToCart = useCallback(async () => {
    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      await addToCart({ sku, qty, storeId, productOptionsJson });
      setSuccess(true);
      openCart();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add item to cart. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [sku, qty, storeId, productOptionsJson, addToCart, openCart]);

  const isDisabled = loading || externalDisabled;

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
        {loading
          ? 'Adding…'
          : success
          ? 'Added!'
          : externalDisabled
          ? disabledLabel
          : 'Add to Cart'}
      </button>

      {error && (
        <p role="alert" className="text-center text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
