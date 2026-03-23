'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ImageTextBlockProps } from '@/lib/api/cms-page.types';

export function ImageTextBlock({
  image,
  imagePosition,
  title,
  description,
  ctaText,
  ctaLink,
  badge,
}: ImageTextBlockProps) {
  const isImageLeft = imagePosition === 'left';

  const imageBlock = (
    <div className="group relative min-h-[560px] overflow-hidden rounded-3xl lg:aspect-auto lg:min-h-0 lg:flex-[2]">
      <Image
        src={image.url}
        alt={image.alternativeText || title}
        fill
        className="object-cover transition-transform duration-1000 group-hover:scale-105"
        sizes="(max-width: 1024px) 100vw, 66vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {badge && (
        <span className="absolute left-8 top-8 z-10 inline-flex h-9 items-center rounded-full bg-brand px-4 py-0 text-xs font-bold uppercase tracking-wide text-white md:left-10 md:top-10">
          {badge}
        </span>
      )}

      {ctaText && ctaLink && (
        <Link
          href={ctaLink}
          className="group/link absolute right-8 top-8 z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-black/25 px-4 text-xs font-normal text-white backdrop-blur-sm transition-colors hover:bg-black/35 hover:text-brand md:right-10 md:top-10"
        >
          {ctaText}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      )}

      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
        <div className="mb-6">
          <h3 className="mb-2 text-2xl font-light text-white md:text-4xl">
            {title}
          </h3>
          {description && (
            <p className="max-w-[80%] text-sm font-light leading-relaxed text-white/80 md:max-w-md md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const textBlock = (
    <div className="flex flex-1 flex-col gap-5 md:gap-6">
      <div className="flex min-h-[260px] flex-1 overflow-hidden rounded-3xl bg-surface p-8 md:p-9">
        <div className="flex flex-col justify-center">
          <h4 className="mb-4 text-xl font-light leading-snug text-ink md:text-2xl">
            {title}
          </h4>
          {description && (
            <p className="text-sm leading-relaxed text-ink-muted md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden bg-white py-16 lg:py-24">
      <div className="w-full px-6 lg:px-[8vw]">
        <div className="flex flex-col items-stretch gap-5 md:gap-6 lg:flex-row">
          {isImageLeft ? (
            <>
              {imageBlock}
              {textBlock}
            </>
          ) : (
            <>
              {textBlock}
              {imageBlock}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
