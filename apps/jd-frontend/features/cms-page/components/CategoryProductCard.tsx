'use client';

import { useEffect, useState } from 'react';
import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { formatPrice } from '@prism/shared';
import { resolveImageUrl } from '@prism/shared';

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
  badge?: string | null;
  badgeStyle?: BadgeStyle | null;
  tagline?: string | null;
  colors?: string[];
  extraColors?: number;
  ratingSummary?: number | null;
  reviewCount?: number | null;
  openInNewTab?: boolean;
}

export function CategoryProductCard({
  href,
  name,
  image,
  price,
  currency,
  badge,
  badgeStyle,
  tagline,
  colors = [],
  extraColors = 0,
  ratingSummary = 0,
  reviewCount = 0,
  openInNewTab = false,
}: CategoryProductCardProps) {
  const rawImage = image?.trim() ?? null;
  const resolvedImage = rawImage
    ? rawImage.startsWith('http://') || rawImage.startsWith('https://')
      ? rawImage
      : resolveImageUrl(rawImage) ?? rawImage
    : null;
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [resolvedImage]);

  const normalizedRating = Math.max(0, Number(ratingSummary) || 0);
  const ratingStars = Math.min(5, normalizedRating / 5);
  const filledStars = Math.floor(ratingStars);
  const hasRating = ratingStars > 0;
  const safeReviewCount = Math.max(0, Number(reviewCount) || 0);

  return (
    <article className="overflow-hidden rounded-xl bg-white">
      <Link
        href={href as never}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className="group/image relative aspect-square overflow-hidden rounded-xl bg-white">
          {resolvedImage && !imageLoadFailed ? (
            <OptimizedImage
              src={resolvedImage}
              alt={name}
              fill
              className="object-contain p-3 transition-transform duration-500 group-hover/image:scale-105"
              maxDisplayWidth={350}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              onError={() => setImageLoadFailed(true)}
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

        <div className="px-1 pb-1 pt-3">
          <h3 className="line-clamp-2 min-h-12 text-base font-medium leading-6 text-ink">
            {name}
          </h3>

          {hasRating && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-3.5 w-3.5 ${
                      index < filledStars
                        ? 'fill-[#f2994a] text-[#f2994a]'
                        : 'text-[#d7d7d7]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-ink">
                {ratingStars.toFixed(1)}
              </span>
              <span className="text-xs text-ink-muted">
                ({safeReviewCount})
              </span>
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 text-xl font-medium leading-none text-ink">
            {price != null ? (
              <>
                {tagline && (
                  <span className="text-base font-normal text-ink-muted line-through">
                    {tagline}
                  </span>
                )}
                <span>{formatPrice(price, currency)}</span>
              </>
            ) : (
              <span className="text-base font-medium text-ink-muted">
                Price unavailable
              </span>
            )}
          </div>

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
    </article>
  );
}
