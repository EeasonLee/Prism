import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardItem } from '../../../lib/api/discovery/types';

interface DiscoveryProductCardProps {
  item: ProductCardItem;
}

export function DiscoveryProductCard({ item }: DiscoveryProductCardProps) {
  const hasPrice = item.price != null;
  const hasDiscount =
    hasPrice && item.price !== (item.price_range?.min ?? item.price);

  return (
    <Link
      href={item.href as Route}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:shadow-md"
    >
      {/* 图片区域 */}
      <div className="relative aspect-square overflow-hidden bg-surface">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted/30">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* 促销标签 */}
        {item.promotion_label && (
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
              {item.promotion_label}
            </span>
          </div>
        )}

        {/* 库存状态 */}
        {!item.in_stock && (
          <span className="absolute right-2 top-2 rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-medium text-white">
            Out of Stock
          </span>
        )}
      </div>

      {/* 信息区域 */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-2 line-clamp-2 text-sm font-medium text-ink leading-snug group-hover:text-brand">
          {item.name}
        </p>
        {item.subtitle && (
          <p className="mb-2 line-clamp-1 text-xs text-ink-muted">
            {item.subtitle}
          </p>
        )}

        {/* 价格 */}
        <div className="mt-auto flex items-baseline gap-2">
          {item.price_range ? (
            <span className="text-base font-bold text-ink">
              ${item.price_range.min.toFixed(2)} – $
              {item.price_range.max.toFixed(2)}
            </span>
          ) : hasPrice ? (
            <>
              {hasDiscount && (
                <span className="text-base font-bold text-ink">
                  ${item.price.toFixed(2)}
                </span>
              )}
              <span
                className={`text-base font-bold ${
                  hasDiscount
                    ? 'text-xs text-ink-muted line-through'
                    : 'text-ink'
                }`}
              >
                ${item.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-ink-muted">
              Price unavailable
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
