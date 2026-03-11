'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HOME_ANIMATIONS_ENABLED } from '@/app/lib/animations';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const products = [
  {
    id: 1,
    name: 'Soy Milk Maker Pro',
    category: 'Soy Milk Makers',
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.8,
    reviews: 256,
    image: '/images/product_soymilk_card.jpg',
    badge: 'Best Seller',
    badgeStyle: 'brand' as const,
  },
  {
    id: 2,
    name: 'Stand Mixer Deluxe',
    category: 'Stand Mixers',
    price: 299.99,
    originalPrice: 349.99,
    rating: 4.9,
    reviews: 189,
    image: '/images/product_mixer_card.jpg',
    badge: 'New',
    badgeStyle: 'dark' as const,
  },
  {
    id: 3,
    name: 'Power Blender',
    category: 'Blenders',
    price: 129.99,
    originalPrice: 159.99,
    rating: 4.7,
    reviews: 324,
    image: '/images/product_blender_card.jpg',
    badge: null,
    badgeStyle: null,
  },
  {
    id: 4,
    name: 'Smart Rice Cooker',
    category: 'Rice Cookers',
    price: 89.99,
    originalPrice: 119.99,
    rating: 4.8,
    reviews: 412,
    image: '/images/product_ricecooker_card.jpg',
    badge: 'Sale',
    badgeStyle: 'brand' as const,
  },
  {
    id: 5,
    name: 'Air Fryer Oven XL',
    category: 'Air Fryers',
    price: 179.99,
    originalPrice: 229.99,
    rating: 4.6,
    reviews: 287,
    image: '/images/product_soymilk_card.jpg',
    badge: 'New',
    badgeStyle: 'dark' as const,
  },
  {
    id: 6,
    name: 'Espresso Machine',
    category: 'Coffee Makers',
    price: 249.99,
    originalPrice: 299.99,
    rating: 4.9,
    reviews: 143,
    image: '/images/product_mixer_card.jpg',
    badge: null,
    badgeStyle: null,
  },
];

const BADGE_CLASSES = {
  brand: 'bg-brand text-white',
  dark: 'bg-ink text-white',
};

export function HomeProductListSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;

    if (!section || !header || !cards) return;
    if (!HOME_ANIMATIONS_ENABLED) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header,
        { y: '4vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      const cardElements = cards.querySelectorAll('.product-card');
      gsap.fromTo(
        cardElements,
        { y: '8vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cards,
            start: 'top 85%',
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
      className="relative w-full bg-white py-12 lg:py-20"
    >
      <div className="w-full px-6 lg:px-[8vw]">
        {/* Header */}
        <div
          ref={headerRef}
          className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <span className="micro-text mb-2 block text-brand">
              Recommended
            </span>
            <h2
              className="heading-3 text-ink"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Popular Products
            </h2>
          </div>
          <a
            href="https://www.joydeem.com/kitchen-appliances/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            View All
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Grid — 2 列 mobile，3 列 md，6 列 lg（每张卡 1fr） */}
        <div
          ref={cardsRef}
          className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-4"
        >
          {products.map(product => (
            <div
              key={product.id}
              className="product-card group isolate cursor-pointer overflow-hidden rounded-xl border border-border bg-white transition-all duration-300 will-change-transform hover:-translate-y-0.5 hover:shadow-card"
            >
              {/* 图片区 — 铺满，aspect-[3/4] 竖版卡片 */}
              <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />

                {/* 渐变遮罩 — 底部信息叠加层 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* 徽章 */}
                {product.badge && product.badgeStyle && (
                  <div
                    className={`absolute left-2.5 top-2.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      BADGE_CLASSES[product.badgeStyle]
                    }`}
                  >
                    {product.badge}
                  </div>
                )}

                {/* 加购按钮 */}
                <button
                  type="button"
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 -translate-y-1 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand hover:text-white"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                </button>

                {/* 底部叠加信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
                    {product.category}
                  </p>
                  <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-white">
                    {product.name}
                  </h3>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-white">
                      ${product.price}
                    </span>
                    <span className="text-xs text-white/50 line-through">
                      ${product.originalPrice}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
