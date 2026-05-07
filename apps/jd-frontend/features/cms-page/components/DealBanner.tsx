'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import type { DealBannerProps } from '../types';

export function DealBanner({
  slides,
  autoPlayInterval = 5000,
  showArrows = true,
  showDots = true,
}: DealBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, autoPlayInterval]);

  if (slides.length === 0) return null;

  return (
    <section className="relative h-[50vh] w-full overflow-hidden md:h-[60vh]">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'z-10 opacity-100' : 'z-0 opacity-0'
          }`}
        >
          <div className="absolute inset-0">
            <OptimizedImage
              src={slide.image.url}
              alt={slide.image.alternativeText ?? slide.title}
              fill
              className="object-cover"
              priority={index === 0}
              maxDisplayWidth={1920}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
          </div>

          <div className="relative z-20 flex h-full items-center">
            <div className="w-full px-6 lg:px-[8vw]">
              <div className="max-w-xl">
                <h1
                  className={`mb-3 text-3xl font-bold leading-tight md:text-5xl ${
                    slide.theme === 'dark' ? 'text-ink' : 'text-white'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p
                    className={`mb-6 text-base md:text-lg ${
                      slide.theme === 'dark'
                        ? 'text-ink-muted'
                        : 'text-white/90'
                    }`}
                  >
                    {slide.subtitle}
                  </p>
                )}
                {slide.ctaText && slide.ctaLink && (
                  <Link
                    href={slide.ctaLink}
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-brand-foreground transition-colors hover:bg-brand/90"
                  >
                    {slide.ctaText}
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {showArrows && slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => {
              prevSlide();
              setIsAutoPlaying(false);
            }}
            className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:left-8"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              nextSlide();
              setIsAutoPlaying(false);
            }}
            className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:right-8"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setCurrentSlide(index);
                setIsAutoPlaying(false);
              }}
              className={`h-2.5 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-6 bg-white'
                  : 'w-2.5 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
