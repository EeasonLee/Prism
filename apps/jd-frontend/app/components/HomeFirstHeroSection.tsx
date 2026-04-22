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

function isExternalLink(link?: string): boolean {
  return !!link && /^https?:\/\//.test(link);
}

export function HomeFirstHeroSection({ config }: ImageTextBlockProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const imagePosition =
    config?.layout?.imagePosition === 'right' ? 'right' : 'left';

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

  const mainImageUrl = config?.main?.image?.url;
  const mainTitle = config?.main?.title;
  const mainDescription = config?.main?.description;
  const mainCtaText = config?.main?.cta?.text;
  const mainCtaLink = config?.main?.cta?.link;
  const mainPriceCurrent = config?.main?.price?.current;
  const mainPriceCurrency = config?.main?.price?.currency;
  const mainAddToCartText = config?.main?.addToCartText;

  const firstSide = config?.sideCards?.[0];
  const secondSide = config?.sideCards?.[1];
  const firstSideImageUrl = firstSide?.image?.url;
  const firstSideTitle = firstSide?.title;
  const firstSideCtaText = firstSide?.cta?.text;
  const firstSideCtaLink = firstSide?.cta?.link;
  const secondSideImageUrl = secondSide?.image?.url;
  const secondSideTitle = secondSide?.title;
  const secondSideCtaText = secondSide?.cta?.text;
  const secondSideCtaLink = secondSide?.cta?.link;

  const hasRequiredData =
    !!mainImageUrl &&
    !!mainTitle &&
    !!mainDescription &&
    !!mainCtaText &&
    !!mainCtaLink &&
    typeof mainPriceCurrent === 'number' &&
    !!mainPriceCurrency &&
    !!mainAddToCartText &&
    !!firstSideImageUrl &&
    !!firstSideTitle &&
    !!firstSideCtaText &&
    !!firstSideCtaLink &&
    !!secondSideImageUrl &&
    !!secondSideTitle &&
    !!secondSideCtaText &&
    !!secondSideCtaLink;

  if (!hasRequiredData) {
    return null;
  }

  const mainCard = {
    productSku: config?.main?.productSku,
    image: {
      url: mainImageUrl,
      alt: config?.main?.image?.alt ?? mainTitle,
    },
    title: mainTitle,
    description: mainDescription,
    badge: config?.main?.badge,
    cta: {
      text: mainCtaText,
      link: mainCtaLink,
    },
    price: {
      current: mainPriceCurrent,
      original: config?.main?.price?.original,
      currency: mainPriceCurrency,
    },
    addToCartText: mainAddToCartText,
  };

  const sideCards = [
    {
      image: {
        url: firstSideImageUrl,
        alt: firstSide?.image?.alt ?? firstSideTitle,
      },
      eyebrow: firstSide?.eyebrow,
      title: firstSideTitle,
      cta: {
        text: firstSideCtaText,
        link: firstSideCtaLink,
      },
    },
    {
      image: {
        url: secondSideImageUrl,
        alt: secondSide?.image?.alt ?? secondSideTitle,
      },
      eyebrow: secondSide?.eyebrow,
      title: secondSideTitle,
      cta: {
        text: secondSideCtaText,
        link: secondSideCtaLink,
      },
    },
  ];

  const originalPrice =
    typeof mainCard.price.original === 'number'
      ? mainCard.price.original
      : null;
  const hasOriginalPrice =
    originalPrice !== null && originalPrice > mainCard.price.current;

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
              src={mainCard.image.url}
              alt={mainCard.image.alt ?? mainCard.title}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {mainCard.badge ? (
              <span className="absolute left-8 top-8 z-10 inline-flex h-9 items-center rounded-full bg-brand px-4 py-0 text-xs font-bold uppercase tracking-wide text-white md:left-10 md:top-10">
                {mainCard.badge}
              </span>
            ) : null}

            <Link
              href={mainCard.cta.link}
              target={isExternalLink(mainCard.cta.link) ? '_blank' : undefined}
              rel={
                isExternalLink(mainCard.cta.link)
                  ? 'noopener noreferrer'
                  : undefined
              }
              className="group/link absolute right-8 top-8 z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-black/25 px-4 text-xs font-normal text-white backdrop-blur-sm transition-colors hover:bg-black/35 hover:text-brand md:right-10 md:top-10"
            >
              {mainCard.cta.text}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
            </Link>

            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-light text-white md:text-4xl">
                  {mainCard.title}
                </h3>
                <p className="line-clamp-4 max-w-[80%] font-light leading-relaxed text-white/80 text-sm md:max-w-md md:text-base">
                  {mainCard.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-baseline gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
                  <span className="text-xl font-bold text-white">
                    {formatPrice(
                      mainCard.price.current,
                      mainCard.price.currency
                    )}
                  </span>
                  {hasOriginalPrice ? (
                    <span className="text-sm text-white/60 line-through">
                      {formatPrice(originalPrice, mainCard.price.currency)}
                    </span>
                  ) : null}
                </div>

                <AddToCartButton
                  sku={mainCard.productSku ?? ''}
                  qty={1}
                  label={mainCard.addToCartText}
                  disabled={!mainCard.productSku}
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
