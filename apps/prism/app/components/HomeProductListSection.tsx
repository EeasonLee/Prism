'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ShoppingCart, Star } from 'lucide-react';
import Image from 'next/image';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const products = [
  {
    id: 1,
    name: 'Joydeem Soy Milk Maker Pro',
    category: 'Soy Milk Makers',
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.8,
    reviews: 256,
    image: '/images/product_soymilk_card.jpg',
    badge: 'Best Seller',
  },
  {
    id: 2,
    name: 'Joydeem Stand Mixer Deluxe',
    category: 'Stand Mixers',
    price: 299.99,
    originalPrice: 349.99,
    rating: 4.9,
    reviews: 189,
    image: '/images/product_mixer_card.jpg',
    badge: 'New',
  },
  {
    id: 3,
    name: 'Joydeem Power Blender',
    category: 'Blenders',
    price: 129.99,
    originalPrice: 159.99,
    rating: 4.7,
    reviews: 324,
    image: '/images/product_blender_card.jpg',
    badge: null,
  },
  {
    id: 4,
    name: 'Joydeem Smart Rice Cooker',
    category: 'Rice Cookers',
    price: 89.99,
    originalPrice: 119.99,
    rating: 4.8,
    reviews: 412,
    image: '/images/product_ricecooker_card.jpg',
    badge: 'Sale',
  },
];

export function HomeProductListSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;

    if (!section || !header || !cards) return;

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
          stagger: 0.1,
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
      className="relative w-full overflow-hidden bg-white py-20 lg:py-28"
    >
      <div className="w-full px-6 lg:px-[8vw]">
        <div
          ref={headerRef}
          className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <span className="micro-text mb-3 block text-[#D94F25]">
              Recommended
            </span>
            <h2
              className="text-3xl font-bold text-[#111] lg:text-4xl"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Popular Products
            </h2>
          </div>
          <a
            href="https://www.joydeem.com/kitchen-appliances/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium text-[#D94F25] transition-all hover:gap-3"
          >
            View All Products
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6"
        >
          {products.map(product => (
            <div
              key={product.id}
              className="product-card group overflow-hidden rounded-[24px] bg-[#F6F6F2] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-square bg-white p-4 lg:p-6">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                {product.badge && (
                  <div
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                      product.badge === 'Sale'
                        ? 'bg-[#D94F25] text-white'
                        : product.badge === 'New'
                        ? 'bg-[#111] text-white'
                        : 'bg-[#D94F25]/10 text-[#D94F25]'
                    }`}
                  >
                    {product.badge}
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white text-[#111] shadow-lg opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 hover:bg-[#D94F25] hover:text-white"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 lg:p-5">
                <span className="mb-1 block text-xs text-[#999]">
                  {product.category}
                </span>
                <h3 className="mb-2 line-clamp-1 text-sm font-semibold text-[#111] transition-colors group-hover:text-[#D94F25] lg:text-base">
                  {product.name}
                </h3>

                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-[#FFB800] text-[#FFB800]" />
                    <span className="text-sm font-medium text-[#111]">
                      {product.rating}
                    </span>
                  </div>
                  <span className="text-xs text-[#999]">
                    ({product.reviews})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#D94F25]">
                    ${product.price}
                  </span>
                  <span className="text-sm text-[#999] line-through">
                    ${product.originalPrice}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
