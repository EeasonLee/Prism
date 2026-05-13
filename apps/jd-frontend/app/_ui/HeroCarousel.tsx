'use client';

import { cn } from '@prism/shared';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@prism/ui/components/carousel';
import { OptimizedImage } from '@prism/ui';
import Autoplay from 'embla-carousel-autoplay';
import { useEffect, useMemo, useState } from 'react';

export interface HeroSlide {
  image: string;
  alt: string;
  title?: string;
  description?: string;
  link?: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  height?: string;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showNavigation?: boolean;
  showContent?: boolean;
}

export function HeroCarousel({
  slides,
  height = 'h-[600px]',
  autoPlayInterval = 5000,
  showIndicators = true,
  showNavigation = true,
  showContent = true,
}: HeroCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    handleSelect();
    api.on('select', handleSelect);
    api.on('reInit', handleSelect);

    return () => {
      api.off('select', handleSelect);
      api.off('reInit', handleSelect);
    };
  }, [api]);

  const plugin = useMemo(
    () =>
      Autoplay({
        delay: autoPlayInterval,
        stopOnInteraction: false,
      }),
    [autoPlayInterval]
  );
  const plugins = useMemo(() => [plugin], [plugin]);

  return (
    <div className={cn('relative w-full overflow-hidden', height)}>
      <Carousel
        setApi={setApi}
        plugins={plugins}
        className="h-full w-full"
        opts={{
          align: 'start',
          loop: true,
        }}
      >
        <CarouselContent className="h-full">
          {slides.map((slide, index) => {
            const Wrapper = slide.link ? 'a' : 'div';
            const wrapperProps = slide.link
              ? { href: slide.link, className: 'relative block h-full w-full' }
              : { className: 'relative h-full w-full' };

            return (
              <CarouselItem key={slide.image || index} className="h-full pl-0">
                <Wrapper {...wrapperProps}>
                  <OptimizedImage
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    maxDisplayWidth={1920}
                    className="object-cover"
                    forceUnoptimized
                    priority={index === 0}
                    sizes="100vw"
                  />
                  {showContent && (slide.title || slide.description) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  )}
                  {showContent && (slide.title || slide.description) && (
                    <div className="absolute bottom-0 left-0 right-0 z-10 p-4 text-white md:p-8 lg:p-16">
                      <div className="mx-auto max-w-7xl text-center">
                        {slide.title && (
                          <h2 className="mb-2 text-xl font-bold md:mb-4 md:text-3xl lg:text-5xl">
                            {slide.title}
                          </h2>
                        )}
                        {slide.description && (
                          <p className="mb-4 text-base md:mb-6 md:text-lg lg:text-xl">
                            {slide.description}
                          </p>
                        )}
                        {slide.link && (
                          <a
                            href={slide.link}
                            className="inline-block rounded-md bg-white px-6 py-3 text-gray-900 transition hover:bg-gray-100"
                          >
                            Learn More
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </Wrapper>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {showNavigation && slides.length > 1 && (
          <>
            <CarouselPrevious className="left-2 hidden min-h-[44px] min-w-[44px] items-center justify-center border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 md:left-8 md:flex md:h-14 md:w-14" />
            <CarouselNext className="right-2 hidden min-h-[44px] min-w-[44px] items-center justify-center border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 md:right-8 md:flex md:h-14 md:w-14" />
          </>
        )}
      </Carousel>
      {showIndicators && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-8">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
              aria-label={`Go to slide ${index + 1}`}
            >
              <span
                className={cn(
                  'h-2 rounded-full transition-all',
                  current === index
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
