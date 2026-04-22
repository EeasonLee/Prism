'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HOME_ANIMATIONS_ENABLED } from '@/app/lib/animations';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';
import { formatPrice } from '@/lib/format-price';
import type { ImageTextBlockProps } from '@/lib/api/cms-page.types';
import { AddToCartButton } from './AddToCartButton';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_MAIN_CARD = {
  productSku: undefined as string | undefined,
  image: {
    url: '/images/recipe_4.jpg',
    alt: 'Automatic Pasta Maker - Fresh texture, zero effort',
  },
  title: 'Mastering the Noodle Craft',
  description: 'Automatic Pasta Maker: Fresh texture, zero effort.',
  badge: undefined,
  cta: {
    text: 'View Product Details',
    link: 'https://www.joydeem.com/kitchen-appliances/',
  },
  price: {
    current: 229.99,
    original: undefined,
    currency: 'USD',
  },
  addToCartText: 'Add to Cart',
};

const DEFAULT_SIDE_CARDS = [
  {
    image: { url: '/images/recipe_2.jpg', alt: 'Kitchen Blog' },
    eyebrow: 'Latest Articles',
    title: 'Kitchen Stories & Tips',
    cta: { text: 'Read Blog', link: '/blog' },
  },
  {
    image: { url: '/images/recipe_1.jpg', alt: 'Recipes' },
    eyebrow: 'Seasonal Recipes',
    title: 'Homemade Delights',
    cta: { text: 'Browse Recipes', link: '/recipes' },
  },
] as const;

function isExternalLink(link?: string): boolean {
  return !!link && /^https?:\/\//.test(link);
}

export function HomeFirstHeroSection({ config }: ImageTextBlockProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const imagePosition =
    config?.layout?.imagePosition === 'right' ? 'right' : 'left';
  const main = {
    productSku: config?.main?.productSku ?? DEFAULT_MAIN_CARD.productSku,
    image: config?.main?.image ?? DEFAULT_MAIN_CARD.image,
    title: config?.main?.title ?? DEFAULT_MAIN_CARD.title,
    description: config?.main?.description ?? DEFAULT_MAIN_CARD.description,
    badge: config?.main?.badge,
    cta: {
      text: config?.main?.cta?.text ?? DEFAULT_MAIN_CARD.cta.text,
      link: config?.main?.cta?.link ?? DEFAULT_MAIN_CARD.cta.link,
    },
    price: {
      current: config?.main?.price?.current ?? DEFAULT_MAIN_CARD.price.current,
      original: config?.main?.price?.original,
      currency:
        config?.main?.price?.currency ?? DEFAULT_MAIN_CARD.price.currency,
    },
    addToCartText:
      config?.main?.addToCartText ?? DEFAULT_MAIN_CARD.addToCartText,
  };
  const sideCards = [0, 1].map(index => ({
    image: config?.sideCards?.[index]?.image ?? DEFAULT_SIDE_CARDS[index].image,
    eyebrow:
      config?.sideCards?.[index]?.eyebrow ?? DEFAULT_SIDE_CARDS[index].eyebrow,
    title: config?.sideCards?.[index]?.title ?? DEFAULT_SIDE_CARDS[index].title,
    cta: {
      text:
        config?.sideCards?.[index]?.cta?.text ??
        DEFAULT_SIDE_CARDS[index].cta.text,
      link:
        config?.sideCards?.[index]?.cta?.link ??
        DEFAULT_SIDE_CARDS[index].cta.link,
    },
  }));
  const hasOriginalPrice =
    typeof main.price.original === 'number' &&
    main.price.original > main.price.current;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;

    if (!section || !left || !right) return;
    if (!HOME_ANIMATIONS_ENABLED) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        left,
        { x: '-8vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
      gsap.fromTo(
        right,
        { x: '8vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-white py-16 lg:py-24"
    >
      <div className="w-full px-6 lg:px-[8vw]">
        <div className="flex flex-col items-stretch gap-5 md:gap-6 lg:flex-row">
          <div
            ref={leftRef}
            className={`group relative min-h-[560px] overflow-hidden rounded-3xl lg:aspect-auto lg:min-h-0 lg:flex-[2] ${
              imagePosition === 'right' ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            <Image
              src={main.image.url}
              alt={main.image.alt ?? main.title}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {main.badge ? (
              <span className="absolute left-8 top-8 z-10 inline-flex h-9 items-center rounded-full bg-brand px-4 py-0 text-xs font-bold uppercase tracking-wide text-white md:left-10 md:top-10">
                {main.badge}
              </span>
            ) : null}

            <Link
              href={main.cta.link}
              target={isExternalLink(main.cta.link) ? '_blank' : undefined}
              rel={
                isExternalLink(main.cta.link)
                  ? 'noopener noreferrer'
                  : undefined
              }
              className="group/link absolute right-8 top-8 z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-black/25 px-4 text-xs font-normal text-white backdrop-blur-sm transition-colors hover:bg-black/35 hover:text-brand md:right-10 md:top-10"
            >
              {main.cta.text}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
            </Link>

            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-light text-white md:text-4xl">
                  {main.title}
                </h3>
                <p className="line-clamp-4 max-w-[80%] font-light leading-relaxed text-white/80 text-sm md:max-w-md md:text-base">
                  {main.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-baseline gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
                  <span className="text-xl font-bold text-white">
                    {formatPrice(main.price.current, main.price.currency)}
                  </span>
                  {hasOriginalPrice ? (
                    <span className="text-sm text-white/60 line-through">
                      {formatPrice(main.price.original, main.price.currency)}
                    </span>
                  ) : null}
                </div>

                <AddToCartButton
                  sku={main.productSku ?? ''}
                  qty={1}
                  label={main.addToCartText}
                  disabled={!main.productSku}
                  disabledLabel="Unavailable"
                  className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div
            ref={rightRef}
            className={`flex flex-1 flex-col gap-5 md:gap-6 ${
              imagePosition === 'right' ? 'lg:order-1' : 'lg:order-2'
            }`}
          >
            <Link
              href={sideCards[0].cta.link}
              className="group relative flex min-h-[260px] flex-1 overflow-hidden rounded-3xl lg:min-h-[280px]"
            >
              <Image
                src={sideCards[0].image.url}
                alt={sideCards[0].image.alt ?? sideCards[0].title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

              <div className="relative flex h-full flex-col justify-between p-8 md:p-9">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 md:text-xs">
                  {sideCards[0].eyebrow}
                </span>
                <div className="w-full">
                  <h4 className="mb-5 text-xl font-light leading-snug text-white md:text-2xl">
                    {sideCards[0].title}
                  </h4>
                  <span className="text-sm font-medium text-white/90">
                    {sideCards[0].cta.text}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-all group-hover:bg-brand group-hover:border-brand md:bottom-9 md:right-9">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>

            <Link
              href={sideCards[1].cta.link}
              className="group relative flex min-h-[260px] flex-1 overflow-hidden rounded-3xl lg:min-h-[280px]"
            >
              <Image
                src={sideCards[1].image.url}
                alt={sideCards[1].image.alt ?? sideCards[1].title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

              <div className="relative flex h-full flex-col justify-between p-8 md:p-9">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 md:text-xs">
                  {sideCards[1].eyebrow}
                </span>
                <div className="w-full">
                  <h4 className="mb-5 text-xl font-light leading-snug text-white md:text-2xl">
                    {sideCards[1].title}
                  </h4>
                  <span className="text-sm font-medium text-white/90">
                    {sideCards[1].cta.text}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-all group-hover:bg-white group-hover:text-ink md:bottom-9 md:right-9">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
