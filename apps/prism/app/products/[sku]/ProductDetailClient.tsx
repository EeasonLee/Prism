'use client';

import { useState } from 'react';
import type {
  MagentoConfigurableOption,
  MagentoProduct,
} from '../../../lib/api/magento/types';
import { AddToCartButton } from '../../components/AddToCartButton';

interface ProductDetailClientProps {
  product: MagentoProduct;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const isConfigurable = product.type_id === 'configurable';
  const configurableOptions: MagentoConfigurableOption[] =
    product.configurable_options ??
    product.extension_attributes?.configurable_product_options ??
    [];

  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, number>
  >({});
  const [qty, setQty] = useState(1);

  const handleAttributeChange = (attributeId: string, valueIndex: number) => {
    setSelectedAttributes(prev => ({ ...prev, [attributeId]: valueIndex }));
  };

  return (
    <div className="space-y-6">
      {/* 可配置商品属性选择 */}
      {isConfigurable && configurableOptions.length > 0 && (
        <div className="space-y-4">
          {configurableOptions.map(option => (
            <div key={option.id}>
              <p className="mb-2 text-sm font-medium text-ink">
                {option.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {option.values.map(val => {
                  const isSelected =
                    selectedAttributes[option.attribute_id] === val.value_index;
                  return (
                    <button
                      key={val.value_index}
                      type="button"
                      onClick={() =>
                        handleAttributeChange(
                          option.attribute_id,
                          val.value_index
                        )
                      }
                      className={`rounded-lg border px-3.5 py-2 text-sm transition ${
                        isSelected
                          ? 'border-brand bg-brand/10 font-semibold text-brand'
                          : 'border-border text-ink hover:border-brand/40 hover:bg-surface'
                      }`}
                    >
                      {val.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 数量选择 */}
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Quantity</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink transition hover:bg-surface"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold text-ink">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty(q => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink transition hover:bg-surface"
          >
            +
          </button>
        </div>
      </div>

      <AddToCartButton
        product={product}
        selectedAttributes={isConfigurable ? selectedAttributes : undefined}
        qty={qty}
      />
    </div>
  );
}
