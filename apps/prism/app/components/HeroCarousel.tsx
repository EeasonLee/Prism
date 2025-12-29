'use client';

import { OptimizedImage } from '@/components/OptimizedImage';
import { cn } from '@/lib/utils';
import Autoplay from 'embla-carousel-autoplay';
import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '../../components/ui/carousel';

export interface HeroSlide {
  image: string;
  alt: string;
  title?: string;
  description?: string;
  link?: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  height?: string; // 如 "h-[600px]" 或 "h-screen"
  autoPlayInterval?: number; // 自动播放间隔（毫秒），默认 5000
  showIndicators?: boolean; // 是否显示指示器
  showNavigation?: boolean; // 是否显示导航箭头
}

export function HeroCarousel({
  slides,
  height = 'h-[600px]',
  autoPlayInterval = 5000,
  showIndicators = true,
  showNavigation = true,
}: HeroCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const plugin = Autoplay({
    delay: autoPlayInterval,
    stopOnInteraction: false,
  });

  return (
    <div className={cn('relative w-full overflow-hidden', height)}>
      <Carousel
        setApi={setApi}
        plugins={[plugin]}
        className="h-full w-full"
        opts={{
          align: 'start',
          loop: true,
        }}
      >
        <CarouselContent className="h-full">
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="h-full pl-0">
              <div className="relative h-full w-full">
                <OptimizedImage
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="100vw"
                />
                {/* 渐变遮罩，用于文字显示 */}
                {(slide.title || slide.description) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                )}
                {/* 文字内容 */}
                {(slide.title || slide.description) && (
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-8 text-white md:p-16">
                    <div className="mx-auto max-w-7xl text-center">
                      {slide.title && (
                        <h2 className="mb-4 text-3xl font-bold md:text-5xl">
                          {slide.title}
                        </h2>
                      )}
                      {slide.description && (
                        <p className="mb-6 text-lg md:text-xl">
                          {slide.description}
                        </p>
                      )}
                      {slide.link && (
                        <a
                          href={slide.link}
                          className="inline-block rounded-md bg-white px-6 py-3 text-gray-900 transition hover:bg-gray-100"
                        >
                          了解更多
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {showNavigation && (
          <>
            <CarouselPrevious className="left-4 h-12 w-12 border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 md:left-8 md:h-14 md:w-14" />
            <CarouselNext className="right-4 h-12 w-12 border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 md:right-8 md:h-14 md:w-14" />
          </>
        )}
      </Carousel>
      {/* 指示器 */}
      {showIndicators && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                current === index
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
