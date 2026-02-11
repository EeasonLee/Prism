'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Check } from 'lucide-react';
import Image from 'next/image';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  '6-speed precision control',
  'Ice crushing power',
  'Dishwasher-safe jar',
  'Pulse function',
];

export function HomeFeaturedProduct2() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const image = imageRef.current;

    if (!section || !content || !image) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content,
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

      gsap.fromTo(
        image,
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
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-white py-16 lg:py-32"
    >
      <div className="w-full px-5 sm:px-6 lg:px-[8vw]">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div ref={imageRef} className="order-1 lg:w-1/2">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              <div className="aspect-square overflow-hidden rounded-[20px] bg-[#F6F6F2] card-shadow lg:rounded-[28px]">
                <Image
                  src="/images/product_blender_card.jpg"
                  alt="Joydeem Power Blender"
                  width={480}
                  height={480}
                  className="h-full w-full object-contain p-6 lg:p-8"
                />
              </div>
              <div className="absolute -left-3 -top-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#111] text-center text-xs font-bold text-white shadow-lg lg:-left-4 lg:-top-4 lg:h-20 lg:w-20 lg:text-sm">
                New
                <br />
                Arrival
              </div>
            </div>
          </div>

          <div ref={contentRef} className="order-2 lg:w-1/2">
            <span className="micro-text mb-3 block text-[#D94F25] lg:mb-4">
              Featured Product
            </span>
            <h2
              className="mb-4 text-3xl font-bold leading-tight text-[#111] sm:text-4xl lg:mb-6 lg:text-5xl"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Joydeem Power
              <br className="hidden sm:block" /> Blender
            </h2>
            <p className="mb-6 text-base leading-relaxed text-[#6B6B6B] lg:mb-8 lg:text-lg">
              From smoothies to soups, create everything with confidence.
              Powerful motor, precision control, and effortless cleanup for your
              daily kitchen adventures.
            </p>

            <ul className="mb-6 space-y-2.5 lg:mb-8 lg:space-y-3">
              {features.map(feature => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#D94F25]/10">
                    <Check className="h-3 w-3 text-[#D94F25]" />
                  </div>
                  <span className="whitespace-nowrap text-sm text-[#111] sm:text-base">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mb-6 flex items-center gap-4 lg:mb-8 lg:gap-6">
              <div>
                <span className="text-xs text-[#6B6B6B] line-through lg:text-sm">
                  $159.99
                </span>
                <div className="text-2xl font-bold text-[#D94F25] lg:text-3xl">
                  $129.99
                </div>
              </div>
              <span className="rounded-full bg-[#D94F25]/10 px-3 py-1 text-xs font-medium text-[#D94F25] lg:text-sm">
                Save 19%
              </span>
            </div>

            <div className="flex flex-wrap gap-3 lg:gap-4">
              <button
                type="button"
                className="btn-primary flex items-center gap-2 px-6 py-3 text-sm lg:px-8 lg:py-4 lg:text-base"
              >
                Add to Cart
                <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
              <button
                type="button"
                className="rounded-full border-2 border-[#111] px-6 py-3 font-medium text-[#111] transition-colors hover:bg-[#111] hover:text-white text-sm lg:px-8 lg:py-4 lg:text-base"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
