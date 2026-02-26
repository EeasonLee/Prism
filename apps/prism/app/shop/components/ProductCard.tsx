import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { MagentoProduct } from '../../../lib/api/magento/types';

interface ProductCardProps {
  product: MagentoProduct;
}

const TYPE_LABEL: Record<string, string> = {
  simple: 'Simple',
  configurable: 'Configurable',
  bundle: 'Bundle',
  grouped: 'Grouped',
  virtual: 'Virtual',
};

const TYPE_STYLE: Record<string, string> = {
  bundle: 'bg-violet-100 text-violet-700',
  configurable: 'bg-blue-100 text-blue-700',
  grouped: 'bg-amber-100 text-amber-700',
  virtual: 'bg-teal-100 text-teal-700',
  simple: 'bg-surface text-ink-muted',
};

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

let starIdCounter = 0;

function StarRating({ percentage }: { percentage: number }) {
  const score = (percentage / 100) * 5;
  const fullStars = Math.floor(score);
  const fraction = score - fullStars;
  const hasHalf = fraction >= 0.25 && fraction < 0.75;
  const clipId = `star-half-${++starIdCounter}`;

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${score.toFixed(1)} out of 5 stars`}
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="10" height="20" />
          </clipPath>
        </defs>
      </svg>
      {Array.from({ length: 5 }, (_, i) => {
        const isFilled = i < fullStars;
        const isHalf = hasHalf && i === fullStars;
        return (
          <svg
            key={i}
            className="relative h-3 w-3"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              d={STAR_PATH}
              fill="currentColor"
              className="text-ink-muted/25"
            />
            {(isFilled || isHalf) && (
              <path
                d={STAR_PATH}
                fill="currentColor"
                className="text-amber-400"
                clipPath={isHalf ? `url(#${clipId})` : undefined}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.thumbnail_url;

  const hasDiscount =
    product.special_price != null && product.special_price < product.price;
  const typeLabel = TYPE_LABEL[product.type_id] ?? product.type_id;
  const typeStyle = TYPE_STYLE[product.type_id] ?? 'bg-surface text-ink-muted';
  const hasRating = (product.rating_percentage ?? 0) > 0;

  return (
    <Link
      href={`/products/${encodeURIComponent(product.sku)}` as Route}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:shadow-md"
    >
      {/* 图片区域 */}
      <div className="relative aspect-square overflow-hidden bg-surface">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
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

        {/* 左上角：Sale 或 Bundle 等类型标签 */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
              Sale
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeStyle}`}
          >
            {typeLabel}
          </span>
        </div>

        {/* 右上角：库存状态 */}
        {product.is_in_stock === false && (
          <span className="absolute right-2 top-2 rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-medium text-white">
            Out of Stock
          </span>
        )}
      </div>

      {/* 信息区域 */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-2 line-clamp-2 text-sm font-medium text-ink leading-snug group-hover:text-brand">
          {product.name}
        </p>

        {/* 评分 */}
        {hasRating ? (
          <div className="mb-2 flex items-center gap-1.5">
            <StarRating percentage={product.rating_percentage ?? 0} />
            <span className="text-[11px] text-ink-muted">
              ({product.review_count})
            </span>
          </div>
        ) : (
          <div className="mb-2 h-4" />
        )}

        {/* 价格 */}
        <div className="mt-auto flex items-baseline gap-2">
          {product.special_price != null && (
            <span className="text-base font-bold text-ink">
              ${product.special_price.toFixed(2)}
            </span>
          )}
          {product.price > 0 && (
            <span
              className={`text-base font-bold ${
                product.special_price != null
                  ? 'text-xs text-ink-muted line-through'
                  : 'text-ink'
              }`}
            >
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
