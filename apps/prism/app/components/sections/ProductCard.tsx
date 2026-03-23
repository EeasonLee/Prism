'use client';

import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { UnifiedProduct } from '@/lib/api/unified-product';

interface ProductCardProps {
  product: UnifiedProduct;
  badgeVariant?: 'brand' | 'dark';
}

const BADGE_CLASSES = {
  brand: 'bg-brand text-white',
  dark: 'bg-ink text-white',
};

export function ProductCard({
  product,
  badgeVariant = 'brand',
}: ProductCardProps) {
  const price = product.price_range?.minimum_price?.final_price?.value;
  const originalPrice =
    product.price_range?.minimum_price?.regular_price?.value;
  const hasDiscount = originalPrice && price && originalPrice > price;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // TODO: Implement add to cart logic
    console.log('Add to cart:', product.sku);
  };

  return (
    <Link
      href={`/products/${product.sku}`}
      className="group isolate cursor-pointer overflow-hidden rounded-xl border border-border bg-white transition-all duration-300 will-change-transform hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface">
        {product.image?.url && (
          <Image
            src={product.image.url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {hasDiscount && (
          <div
            className={`absolute left-2.5 top-2.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${BADGE_CLASSES[badgeVariant]}`}
          >
            Sale
          </div>
        )}

        <button
          type="button"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 -translate-y-1 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand hover:text-white"
          aria-label="Add to cart"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-white">
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            {price && (
              <span className="text-sm font-bold text-white">
                ${price.toFixed(2)}
              </span>
            )}
            {hasDiscount && originalPrice && (
              <span className="text-xs text-white/50 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
