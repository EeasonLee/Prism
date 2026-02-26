'use client';

import { ShoppingCart } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useAuth } from '../../lib/auth/context';
import { useCart } from '../../lib/cart/context';
import type {
  MagentoConfigurableOption,
  MagentoProduct,
} from '../../lib/api/magento/types';
import { LoginModal } from './LoginModal';

interface AddToCartButtonProps {
  product: MagentoProduct;
  /** 外部传入已选属性（商品详情页使用） */
  selectedAttributes?: Record<string, number>;
  qty?: number;
  className?: string;
}

export function AddToCartButton({
  product,
  selectedAttributes,
  qty = 1,
  className,
}: AddToCartButtonProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart, openCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [success, setSuccess] = useState(false);

  const isConfigurable = product.type_id === 'configurable';
  const configurableOptions: MagentoConfigurableOption[] =
    product.configurable_options ??
    product.extension_attributes?.configurable_product_options ??
    [];

  // 检查可配置商品是否已全部选中属性
  const allAttributesSelected =
    !isConfigurable ||
    configurableOptions.every(
      opt =>
        selectedAttributes && selectedAttributes[opt.attribute_id] !== undefined
    );

  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      let productOptionsJson: string | undefined;
      if (isConfigurable && selectedAttributes) {
        productOptionsJson = JSON.stringify({
          super_attribute: selectedAttributes,
        });
      }

      await addToCart({
        sku: product.sku,
        qty,
        storeId: 1,
        productOptionsJson,
      });

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
  }, [
    isAuthenticated,
    isConfigurable,
    selectedAttributes,
    product.sku,
    qty,
    addToCart,
    openCart,
  ]);

  const isDisabled = loading || (isConfigurable && !allAttributesSelected);

  return (
    <>
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
            : isConfigurable && !allAttributesSelected
            ? 'Select Options'
            : 'Add to Cart'}
        </button>

        {error && (
          <p role="alert" className="text-center text-xs text-red-500">
            {error}
          </p>
        )}
      </div>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleAddToCart}
      />
    </>
  );
}
