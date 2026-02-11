'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function HomeFirstHeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;

    if (!section || !left || !right) return;

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

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-white py-12 md:py-24"
    >
      <div className="w-full px-6 lg:px-[8vw]">
        <div className="flex flex-col items-stretch gap-6 md:gap-8 lg:flex-row">
          {/* 左侧主宣传区 */}
          <div
            ref={leftRef}
            className="group relative min-h-[500px] overflow-hidden rounded-3xl lg:aspect-auto lg:flex-[2] lg:min-h-0"
          >
            <Image
              src="/images/recipe_4.jpg"
              alt="Automatic Pasta Maker - Fresh texture, zero effort"
              width={1200}
              height={900}
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-8 md:p-12">
              <h3 className="mb-2 text-2xl font-light text-white md:text-4xl">
                Mastering the Noodle Craft
              </h3>
              <p className="mb-6 max-w-[80%] font-light leading-relaxed text-white/80 text-sm md:max-w-md md:text-base">
                Automatic Pasta Maker: Fresh texture, zero effort.
              </p>
              <Link
                href="https://www.joydeem.com/kitchen-appliances/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit border-b border-white pb-1 text-sm font-semibold text-white transition-colors hover:border-[#D94F25] hover:text-[#D94F25] md:text-base"
              >
                Shop Automatic Series
              </Link>
            </div>
          </div>

          {/* 右侧双卡片 */}
          <div
            ref={rightRef}
            className="flex flex-1 flex-col gap-6 md:gap-8 lg:flex-col"
          >
            <Link
              href="https://www.joydeem.com/kitchen-appliances/kitchen-appliances-blenders-juicers-html.html"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[260px] flex-1 flex-col justify-between rounded-3xl border border-[#E5E5E5] bg-[#F6F6F2] p-8 transition-all duration-500 hover:bg-[#EFEFEA] md:p-10"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D94F25] md:text-xs">
                  Limited Edition
                </span>
                <h4 className="mt-3 text-xl font-light leading-snug text-[#111] md:text-2xl">
                  Cream White Blender
                </h4>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-[#111]">$189.00</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E5E5] transition-all group-hover:bg-[#D94F25] group-hover:text-white group-hover:border-[#D94F25]">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            <Link
              href="https://www.joydeem.com/kitchen-appliances/rice-cookers.html"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[260px] flex-1 flex-col justify-between rounded-3xl bg-[#111] p-8 text-white transition-all duration-500 hover:bg-[#2a2a2a] md:p-10"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#999] md:text-xs">
                  Seasonal Offer
                </span>
                <h4 className="mt-3 text-xl font-light leading-snug md:text-2xl">
                  Family Size Rice Cookers
                </h4>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-white/90">
                  View Collection
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition-all group-hover:bg-white group-hover:text-[#111]">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
