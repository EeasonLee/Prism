'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HOME_ANIMATIONS_ENABLED } from '@/app/lib/animations';
import { ArrowRight, Check } from 'lucide-react';
import Image from 'next/image';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const featuredProducts = [
  {
    id: 1,
    label: 'Best Seller',
    name: 'Joydeem Soy Milk Maker Pro',
    description:
      'Fresh, smooth soy milk in minutes. One-touch operation with auto-clean and quiet motor design.',
    features: [
      'One-touch operation',
      'Auto-clean function',
      'BPA-free materials',
    ],
    price: 149.99,
    originalPrice: 199.99,
    discount: 25,
    image: '/images/product_soymilk_card.jpg',
    href: 'https://www.joydeem.com/kitchen-appliances/',
  },
  {
    id: 2,
    label: 'New Arrival',
    name: 'Joydeem Stand Mixer Deluxe',
    description:
      'Professional-grade mixing for every recipe. 12-speed settings with tilt-head design and splash guard.',
    features: ['12-speed settings', 'Tilt-head design', '5.5Qt stainless bowl'],
    price: 299.99,
    originalPrice: 349.99,
    discount: 14,
    image: '/images/product_mixer_card.jpg',
    href: 'https://www.joydeem.com/kitchen-appliances/',
  },
];

export function HomeFeaturedProduct() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current;

    if (!section || !cards) return;
    if (!HOME_ANIMATIONS_ENABLED) return;

    const ctx = gsap.context(() => {
      const items = cards.querySelectorAll('.featured-card');
      gsap.fromTo(
        items,
        { y: '6vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
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
      className="relative w-full bg-surface py-12 lg:py-20"
    >
      <div className="w-full px-5 sm:px-6 lg:px-[8vw]">
        {/* Header */}
        <div className="mb-8">
          <span className="micro-text mb-2 block text-brand">
            Featured Products
          </span>
          <h2
            className="heading-3 text-ink"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Crafted for Your Kitchen
          </h2>
        </div>

        {/* 两张卡片 */}
        <div ref={cardsRef} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {featuredProducts.map(product => (
            <div
              key={product.id}
              className="featured-card group overflow-hidden rounded-2xl border border-border bg-white"
            >
              <div className="flex flex-col sm:flex-row">
                {/* 图片 — 正方形铺满，无白边 */}
                <div className="relative aspect-square w-full shrink-0 overflow-hidden sm:w-[240px] lg:w-[280px]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 280px"
                  />
                  {/* 标签 */}
                  <div className="absolute left-3 top-3 rounded bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {product.label}
                  </div>
                </div>

                {/* 内容 */}
                <div className="flex flex-1 flex-col justify-between p-5 lg:p-6">
                  <div>
                    <h3
                      className="mb-2 text-lg font-bold leading-snug text-ink lg:text-xl"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {product.name}
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-ink-muted">
                      {product.description}
                    </p>

                    {/* Features */}
                    <ul className="mb-5 space-y-1.5">
                      {product.features.map(f => (
                        <li key={f} className="flex items-center gap-2">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10">
                            <Check className="h-2.5 w-2.5 text-brand" />
                          </div>
                          <span className="text-sm text-ink">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 价格行 + CTA */}
                  <div>
                    {/* 价格与折扣一排 */}
                    <div className="mb-4 flex items-center gap-3">
                      <span className="text-2xl font-bold text-brand">
                        ${product.price}
                      </span>
                      <span className="text-sm text-ink-faint line-through">
                        ${product.originalPrice}
                      </span>
                      <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                        Save {product.discount}%
                      </span>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-sm"
                      >
                        Add to Cart
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={product.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
                      >
                        Learn More
                      </a>
                    </div>
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
