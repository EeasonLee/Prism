'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AddToCartButton } from '@/app/components/AddToCartButton';
import { formatPrice } from '@/lib/format-price';

type BadgeStyle = 'brand' | 'dark' | 'light';

const BADGE_CLASSES: Record<BadgeStyle, string> = {
  brand: 'bg-brand text-white',
  dark: 'bg-ink text-white',
  light: 'bg-brand/10 text-brand',
};

interface CategoryProductCardProps {
  href: string;
  name: string;
  image: string | null;
  price: number | null;
  currency?: string | null;
  sku: string;
  badge?: string | null;
  badgeStyle?: BadgeStyle | null;
  tagline?: string | null;
  colors?: string[];
  extraColors?: number;
  disabled?: boolean;
  disabledLabel?: string;
  openInNewTab?: boolean;
}

export function CategoryProductCard({
  href,
  name,
  image,
  price,
  currency,
  sku,
  badge,
  badgeStyle,
  tagline,
  colors = [],
  extraColors = 0,
  disabled = false,
  disabledLabel = 'Unavailable',
  openInNewTab = false,
}: CategoryProductCardProps) {
  return (
    <article className="group">
      <Link
        href={href as never}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className="block"
      >
        <div className="relative mb-3 aspect-square overflow-hidden rounded-xl border border-border bg-surface">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 50vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-xs text-ink-muted">No image</span>
            </div>
          )}
          {badge && badgeStyle && (
            <div
              className={`absolute left-2.5 top-2.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${BADGE_CLASSES[badgeStyle]}`}
            >
              {badge}
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-ink transition-colors group-hover:text-brand">
            {name}
          </h3>
          <span className="shrink-0 text-sm font-bold text-ink">
            {price != null ? formatPrice(price, currency) : 'Price unavailable'}
          </span>
        </div>

        {tagline ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
            {tagline}
          </p>
        ) : null}

        {(colors.length > 0 || extraColors > 0) && (
          <div className="mt-1.5 flex items-center gap-1">
            {colors.map(color => (
              <span
                key={color}
                className="h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            ))}
            {extraColors > 0 && (
              <span className="text-[11px] text-ink-faint">+{extraColors}</span>
            )}
          </div>
        )}
      </Link>

      <div className="mt-2">
        <AddToCartButton
          sku={sku}
          qty={1}
          disabled={disabled}
          disabledLabel={disabledLabel}
          className="btn-primary flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </article>
  );
}
