'use client';

import { ShoppingCart } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useAddToCartAction, applyCoupon, useCart } from '@/features/cart';
import { gtmAddToCart, mapDisplayToGtmItem } from '@/shared/utils/gtm';

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
  /** 加购成功后自动应用的优惠券码 */
  couponCode?: string | null;
  className?: string;
  /** GTM product data for add_to_cart event */
  gtmProduct?: {
    sku: string;
    name: string;
    price: number;
    final_price?: number;
    currency?: string;
    categories?: string[];
    brand?: string | null;
    url_key?: string | null;
    image?: string | null;
  };
}

export function AddToCartButton({
  sku,
  qty = 1,
  storeId = 1,
  label = 'Add to Cart',
  productOptionsJson,
  couponCode,
  disabled: externalDisabled = false,
  disabledLabel = 'Select Options',
  className,
  gtmProduct,
}: AddToCartButtonProps) {
  const { addItemToCart, isAdding, error, success, resetSuccess } =
    useAddToCartAction();
  const { syncCart } = useCart();

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => resetSuccess(), 3000);
    return () => window.clearTimeout(timer);
  }, [resetSuccess, success]);

  const handleAddToCart = useCallback(async () => {
    const result = await addItemToCart(
      { sku, qty, storeId, productOptionsJson },
      { openCartOnSuccess: true }
    );
    if (result && gtmProduct) {
      gtmAddToCart(
        mapDisplayToGtmItem({
          sku: gtmProduct.sku,
          name: gtmProduct.name,
          price: gtmProduct.price,
          final_price: gtmProduct.final_price ?? gtmProduct.price,
          currency: gtmProduct.currency,
          categories: gtmProduct.categories,
          brand: gtmProduct.brand,
          url_key: gtmProduct.url_key,
          image: gtmProduct.image,
        }),
        qty
      );
    }
    if (result && couponCode) {
      try {
        await applyCoupon(couponCode);
        await syncCart();
      } catch {
        // 静默忽略 applyCoupon 失败
      }
    }
  }, [
    addItemToCart,
    productOptionsJson,
    qty,
    sku,
    storeId,
    couponCode,
    syncCart,
    gtmProduct,
  ]);

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
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
