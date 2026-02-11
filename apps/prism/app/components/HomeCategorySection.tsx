'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const categories = [
  {
    id: 1,
    name: 'Soy Milk Makers',
    description: 'Fresh & nutritious',
    image: '/images/product_soymilk_card.jpg',
    count: 4,
  },
  {
    id: 2,
    name: 'Stand Mixers',
    description: 'Power & precision',
    image: '/images/product_mixer_card.jpg',
    count: 3,
  },
  {
    id: 3,
    name: 'Blenders',
    description: 'Smooth & creamy',
    image: '/images/product_blender_card.jpg',
    count: 5,
  },
  {
    id: 4,
    name: 'Rice Cookers',
    description: 'Perfect every time',
    image: '/images/product_ricecooker_card.jpg',
    count: 3,
  },
];

export function HomeCategorySection() {
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

      const cardElements = cards.querySelectorAll('.category-card');
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
      id="products"
      className="relative w-full overflow-hidden bg-white py-20 lg:py-28"
    >
      <div className="w-full px-6 lg:px-[8vw]">
        <div
          ref={headerRef}
          className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <span className="micro-text mb-3 block text-[#D94F25]">
              Categories
            </span>
            <h2
              className="text-3xl font-bold text-[#111] lg:text-4xl"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Shop by Category
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
          {categories.map(category => (
            <a
              key={category.id}
              href="https://www.joydeem.com/kitchen-appliances/"
              target="_blank"
              rel="noopener noreferrer"
              className="category-card group block overflow-hidden rounded-[24px] bg-[#F6F6F2] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-square bg-white p-6 lg:p-8">
                <Image
                  src={category.image}
                  alt={category.name}
                  width={400}
                  height={400}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4 lg:p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#111] transition-colors group-hover:text-[#D94F25]">
                    {category.name}
                  </h3>
                  <ArrowRight className="h-5 w-5 translate-x-2 text-[#6B6B6B] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
                <p className="mb-2 text-sm text-[#6B6B6B]">
                  {category.description}
                </p>
                <span className="text-xs text-[#999]">
                  {category.count} products
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
