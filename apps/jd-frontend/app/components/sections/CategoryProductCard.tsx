'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AddToCartButton } from '@/app/components/AddToCartButton';
import { formatPrice } from '@/lib/format-price';

type BadgeStyle = 'brand' | 'dark' | 'light';

const BADGE_CLASSES: Record<BadgeStyle, string> = {
  brand: 'bg-brand text-brand-foreground shadow-sm',
  dark: 'bg-ink text-white shadow-sm',
  light: 'bg-brand/10 text-brand ring-1 ring-inset ring-brand/20',
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
    <article className="group overflow-hidden rounded-xl border border-border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <Link
        href={href as never}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className="relative aspect-square overflow-hidden bg-surface">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="micro-text normal-case tracking-normal text-ink-muted">
                No image
              </span>
            </div>
          )}
          {badge && badgeStyle && (
            <div
              className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${BADGE_CLASSES[badgeStyle]}`}
            >
              {badge}
            </div>
          )}
        </div>

        <div className="p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-snug text-ink transition-colors group-hover:text-brand">
              {name}
            </h3>
            <span className="shrink-0 text-right text-sm font-bold tabular-nums text-ink">
              {price != null
                ? formatPrice(price, currency)
                : 'Price unavailable'}
            </span>
          </div>

          {tagline ? (
            <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-ink-muted">
              {tagline}
            </p>
          ) : null}

          {(colors.length > 0 || extraColors > 0) && (
            <div className="mt-2 flex items-center gap-1.5">
              {colors.map(color => (
                <span
                  key={color}
                  title={color}
                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-border shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
              {extraColors > 0 && (
                <span className="text-xs text-ink-faint">+{extraColors}</span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="px-3 pb-3">
        <AddToCartButton
          sku={sku}
          qty={1}
          disabled={disabled}
          disabledLabel={disabledLabel}
          className="btn-primary flex h-9 w-full min-h-touch items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </article>
  );
}
