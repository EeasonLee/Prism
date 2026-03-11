'use client';

import { useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'soy-milk', label: 'Soy Milk Makers' },
  { id: 'blenders', label: 'Blenders & Juicers' },
  { id: 'mixers', label: 'Stand Mixers' },
  { id: 'rice-cookers', label: 'Rice Cookers' },
  { id: 'air-fryers', label: 'Air Fryers' },
  { id: 'coffee', label: 'Coffee Makers' },
  { id: 'cookware', label: 'Cookware' },
  { id: 'small-appliances', label: 'Small Appliances' },
  { id: 'large-appliances', label: 'Large Appliances' },
  { id: 'appliances', label: 'Appliances' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'parts', label: 'Parts' },
  { id: 'repairs', label: 'Repairs' },
  { id: 'warranties', label: 'Warranties' },
  { id: 'customer-service', label: 'Customer Service' },
  { id: 'contact-us', label: 'Contact Us' },
  { id: 'about-us', label: 'About Us' },
  { id: 'privacy-policy', label: 'Privacy Policy' },
  { id: 'terms-of-service', label: 'Terms of Service' },
];

type BadgeStyle = 'brand' | 'dark' | 'light';

interface CategoryProduct {
  id: number;
  name: string;
  tagline: string;
  price: number;
  badge: string | null;
  badgeStyle: BadgeStyle | null;
  image: string;
  colors: string[];
  extraColors: number;
  href: string;
}

const PRODUCTS_BY_CATEGORY: Record<string, CategoryProduct[]> = {
  'soy-milk': [
    {
      id: 1,
      name: 'Soy Milk Maker Pro',
      tagline: 'One-touch fresh soy milk every morning.',
      price: 149.99,
      badge: 'Best Seller',
      badgeStyle: 'light',
      image: '/images/product_soymilk_card.jpg',
      colors: ['#F5F0EB', '#2C2C2C', '#D94F25'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 2,
      name: 'Soy Milk Maker Mini',
      tagline: 'Compact design for single servings.',
      price: 89.99,
      badge: 'New',
      badgeStyle: 'dark',
      image: '/images/product_soymilk_card.jpg',
      colors: ['#FFFFFF', '#E8E0D5'],
      extraColors: 2,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 3,
      name: 'Soy Milk Maker Ultra',
      tagline: 'Multi-function: soy milk, oat milk, soup.',
      price: 199.99,
      badge: null,
      badgeStyle: null,
      image: '/images/product_soymilk_card.jpg',
      colors: ['#C0B8AE', '#2C2C2C'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 22,
      name: 'Soy Milk Maker Slim',
      tagline: 'Space-saving design, full-size results.',
      price: 109.99,
      badge: 'Sale',
      badgeStyle: 'brand',
      image: '/images/product_soymilk_card.jpg',
      colors: ['#F5F0EB', '#2C2C2C'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
  ],
  blenders: [
    {
      id: 4,
      name: 'Power Blender 1800W',
      tagline: 'Crushes ice, seeds and frozen fruit.',
      price: 129.99,
      badge: 'Sale',
      badgeStyle: 'brand',
      image: '/images/product_blender_card.jpg',
      colors: ['#F5F0EB', '#2C2C2C', '#8B7355'],
      extraColors: 2,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 5,
      name: 'Personal Blender',
      tagline: 'Portable, powerful, perfect for smoothies.',
      price: 59.99,
      badge: null,
      badgeStyle: null,
      image: '/images/product_blender_card.jpg',
      colors: ['#D94F25', '#2C2C2C'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 6,
      name: 'Quiet Blender Pro',
      tagline: 'Whisper-quiet motor for early mornings.',
      price: 179.99,
      badge: 'New',
      badgeStyle: 'dark',
      image: '/images/product_blender_card.jpg',
      colors: ['#FFFFFF', '#E8E0D5', '#C0B8AE'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 23,
      name: 'Blender & Juicer Combo',
      tagline: 'Two appliances, one smart machine.',
      price: 149.99,
      badge: 'Best Seller',
      badgeStyle: 'light',
      image: '/images/product_blender_card.jpg',
      colors: ['#2C2C2C'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
  ],
  mixers: [
    {
      id: 7,
      name: 'Stand Mixer Deluxe',
      tagline: '12-speed settings, 5.5Qt stainless bowl.',
      price: 299.99,
      badge: 'Best Seller',
      badgeStyle: 'light',
      image: '/images/product_mixer_card.jpg',
      colors: ['#F5F0EB', '#D94F25', '#2C2C2C'],
      extraColors: 3,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 8,
      name: 'Hand Mixer Pro',
      tagline: 'Lightweight with 9 attachments included.',
      price: 79.99,
      badge: null,
      badgeStyle: null,
      image: '/images/product_mixer_card.jpg',
      colors: ['#FFFFFF', '#8B7355'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 9,
      name: 'Stand Mixer Classic',
      tagline: 'Timeless design meets modern performance.',
      price: 249.99,
      badge: 'Sale',
      badgeStyle: 'brand',
      image: '/images/product_mixer_card.jpg',
      colors: ['#C0B8AE', '#2C2C2C', '#D94F25'],
      extraColors: 2,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 24,
      name: 'Tilt-Head Mixer',
      tagline: 'Easy bowl access, powerful 500W motor.',
      price: 189.99,
      badge: 'New',
      badgeStyle: 'dark',
      image: '/images/product_mixer_card.jpg',
      colors: ['#F5F0EB', '#2C2C2C'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
  ],
  'rice-cookers': [
    {
      id: 10,
      name: 'Smart Rice Cooker 6-Cup',
      tagline: 'Perfect rice, every time. Fuzzy logic tech.',
      price: 89.99,
      badge: 'Sale',
      badgeStyle: 'brand',
      image: '/images/product_ricecooker_card.jpg',
      colors: ['#FFFFFF', '#2C2C2C'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 11,
      name: 'Family Rice Cooker 10-Cup',
      tagline: 'Steam, slow cook, and keep warm.',
      price: 129.99,
      badge: null,
      badgeStyle: null,
      image: '/images/product_ricecooker_card.jpg',
      colors: ['#F5F0EB', '#2C2C2C'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 12,
      name: 'Induction Rice Cooker',
      tagline: 'IH technology for restaurant-quality rice.',
      price: 199.99,
      badge: 'New',
      badgeStyle: 'dark',
      image: '/images/product_ricecooker_card.jpg',
      colors: ['#2C2C2C'],
      extraColors: 2,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 25,
      name: 'Mini Rice Cooker 3-Cup',
      tagline: 'Perfect for dorms and small kitchens.',
      price: 49.99,
      badge: 'Sale',
      badgeStyle: 'brand',
      image: '/images/product_ricecooker_card.jpg',
      colors: ['#FFFFFF', '#D94F25'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
  ],
  'air-fryers': [
    {
      id: 13,
      name: 'Air Fryer Oven XL',
      tagline: '8-in-1: air fry, roast, bake, dehydrate.',
      price: 179.99,
      badge: 'New',
      badgeStyle: 'dark',
      image: '/images/product_soymilk_card.jpg',
      colors: ['#F5F0EB', '#2C2C2C'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 14,
      name: 'Compact Air Fryer 4Qt',
      tagline: 'Perfect size for couples and small families.',
      price: 89.99,
      badge: null,
      badgeStyle: null,
      image: '/images/product_soymilk_card.jpg',
      colors: ['#D94F25', '#2C2C2C', '#FFFFFF'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 15,
      name: 'Air Fryer Dual Basket',
      tagline: 'Cook two dishes simultaneously.',
      price: 149.99,
      badge: 'Sale',
      badgeStyle: 'brand',
      image: '/images/product_soymilk_card.jpg',
      colors: ['#2C2C2C'],
      extraColors: 2,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 26,
      name: 'Air Fryer Toaster Oven',
      tagline: 'Fits a 12-inch pizza. 10 cooking functions.',
      price: 219.99,
      badge: 'Best Seller',
      badgeStyle: 'light',
      image: '/images/product_soymilk_card.jpg',
      colors: ['#C0B8AE', '#2C2C2C'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
  ],
  coffee: [
    {
      id: 16,
      name: 'Espresso Machine Pro',
      tagline: '15-bar pressure. Café quality at home.',
      price: 249.99,
      badge: 'Best Seller',
      badgeStyle: 'light',
      image: '/images/product_mixer_card.jpg',
      colors: ['#C0B8AE', '#2C2C2C'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 17,
      name: 'Drip Coffee Maker',
      tagline: 'Brew 12 cups in under 10 minutes.',
      price: 79.99,
      badge: null,
      badgeStyle: null,
      image: '/images/product_mixer_card.jpg',
      colors: ['#FFFFFF', '#2C2C2C', '#8B7355'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 18,
      name: 'French Press Kettle Set',
      tagline: 'Pour-over precision with gooseneck kettle.',
      price: 119.99,
      badge: 'New',
      badgeStyle: 'dark',
      image: '/images/product_mixer_card.jpg',
      colors: ['#F5F0EB', '#2C2C2C'],
      extraColors: 2,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 27,
      name: 'Cold Brew Maker',
      tagline: 'Smooth cold brew in 12 hours, not 24.',
      price: 59.99,
      badge: 'Sale',
      badgeStyle: 'brand',
      image: '/images/product_mixer_card.jpg',
      colors: ['#2C2C2C'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
  ],
  cookware: [
    {
      id: 19,
      name: 'Non-Stick Fry Pan Set',
      tagline: 'Granite coating. Oven safe to 450°F.',
      price: 99.99,
      badge: 'Sale',
      badgeStyle: 'brand',
      image: '/images/product_blender_card.jpg',
      colors: ['#8B7355', '#2C2C2C'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 20,
      name: 'Cast Iron Dutch Oven',
      tagline: 'Enameled interior for easy cleanup.',
      price: 149.99,
      badge: null,
      badgeStyle: null,
      image: '/images/product_blender_card.jpg',
      colors: ['#D94F25', '#2C2C2C', '#C0B8AE'],
      extraColors: 2,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 21,
      name: 'Stainless Steel Wok',
      tagline: 'Induction compatible. Even heat distribution.',
      price: 69.99,
      badge: 'New',
      badgeStyle: 'dark',
      image: '/images/product_blender_card.jpg',
      colors: ['#C0B8AE'],
      extraColors: 0,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
    {
      id: 28,
      name: 'Ceramic Sauce Pan',
      tagline: 'Non-toxic ceramic, dishwasher safe.',
      price: 49.99,
      badge: 'Best Seller',
      badgeStyle: 'light',
      image: '/images/product_blender_card.jpg',
      colors: ['#F5F0EB', '#D94F25'],
      extraColors: 1,
      href: 'https://www.joydeem.com/kitchen-appliances/',
    },
  ],
};

const BADGE_CLASSES: Record<BadgeStyle, string> = {
  brand: 'bg-brand text-white',
  dark: 'bg-ink text-white',
  light: 'bg-brand/10 text-brand',
};

export function HomeCategorySection() {
  const [activeCategory, setActiveCategory] = useState('soy-milk');
  const tabsRef = useRef<HTMLDivElement>(null);

  const products = PRODUCTS_BY_CATEGORY[activeCategory] ?? [];
  const activeCategoryLabel =
    CATEGORIES.find(c => c.id === activeCategory)?.label ?? '';

  const scroll = (dir: 'left' | 'right') => {
    tabsRef.current?.scrollBy({
      left: dir === 'left' ? -240 : 240,
      behavior: 'smooth',
    });
  };

  return (
    <section className="w-full bg-surface py-12 lg:py-20">
      <div className="w-full px-6 lg:px-[8vw]">
        {/* Header */}
        <h2
          className="heading-3 mb-8 text-center text-ink"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Our Best Sellers
        </h2>

        {/* Category tabs — 滚动容器，箭头叠在左右遮罩上 */}
        <div className="mb-6">
          <div className="relative overflow-hidden rounded-full border border-border">
            {/* 左侧渐变遮罩 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-surface to-transparent" />
            {/* 右侧渐变遮罩 */}
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface to-transparent" />

            {/* 左箭头 — 叠在左侧遮罩上 */}
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition hover:border-ink hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {/* 右箭头 — 叠在右侧遮罩上 */}
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition hover:border-ink hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div
              ref={tabsRef}
              className="no-scrollbar flex gap-1 overflow-x-auto px-12 py-1.5"
            >
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-ink text-white'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product grid — 4列，图片铺满 */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map(product => (
            <Link
              key={product.id}
              href={product.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              {/* 图片区 — 1:1 铺满居中 */}
              <div className="relative mb-3 aspect-square overflow-hidden rounded-xl border border-border bg-surface">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                {product.badge && product.badgeStyle && (
                  <div
                    className={`absolute left-2.5 top-2.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      BADGE_CLASSES[product.badgeStyle]
                    }`}
                  >
                    {product.badge}
                  </div>
                )}
              </div>

              {/* 名称 + 价格一行 */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-sm font-semibold text-ink transition-colors group-hover:text-brand">
                  {product.name}
                </h3>
                <span className="shrink-0 text-sm font-bold text-ink">
                  ${product.price}
                </span>
              </div>

              {/* 副标题 */}
              <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                {product.tagline}
              </p>

              {/* 色板 */}
              <div className="mt-1.5 flex items-center gap-1">
                {product.colors.map(color => (
                  <span
                    key={color}
                    className="h-3 w-3 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
                {product.extraColors > 0 && (
                  <span className="text-[11px] text-ink-faint">
                    +{product.extraColors}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* View all */}
        <div className="mt-7 flex justify-center">
          <Link
            href="https://www.joydeem.com/kitchen-appliances/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-ink transition-all hover:border-ink hover:bg-ink hover:text-white"
          >
            View All {activeCategoryLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
