'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HOME_ANIMATIONS_ENABLED } from '@/app/lib/animations';
import { ArrowRight, ShoppingCart } from 'lucide-react';
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
    if (!HOME_ANIMATIONS_ENABLED) return;

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
      className="relative w-full overflow-hidden bg-white py-16 lg:py-24"
    >
      <div className="w-full px-6 lg:px-[8vw]">
        <div className="flex flex-col items-stretch gap-5 md:gap-6 lg:flex-row">
          {/* ① 左侧主推品大图 */}
          <div
            ref={leftRef}
            className="group relative min-h-[560px] overflow-hidden rounded-3xl lg:aspect-auto lg:min-h-0 lg:flex-[2]"
          >
            <Image
              src="/images/recipe_4.jpg"
              alt="Automatic Pasta Maker - Fresh texture, zero effort"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* SAVE 18% — 左上角 */}
            <span
              className="absolute left-8 top-8 z-10 inline-flex h-9 items-center rounded-full bg-brand px-4 py-0 text-xs font-bold uppercase tracking-wide text-white md:left-10 md:top-10"
              aria-hidden
            >
              SAVE 18%
            </span>

            {/* View Product Details — 右上角，与 SAVE 18% 对齐 */}
            <Link
              href="https://www.joydeem.com/kitchen-appliances/"
              target="_blank"
              rel="noopener noreferrer"
              className="group/link absolute right-8 top-8 z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-black/25 px-4 text-xs font-normal text-white backdrop-blur-sm transition-colors hover:bg-black/35 hover:text-brand md:right-10 md:top-10"
            >
              View Product Details
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
            </Link>

            {/* 内容区 */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
              {/* 文字 */}
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-light text-white md:text-4xl">
                  Mastering the Noodle Craft
                </h3>
                <p className="max-w-[80%] font-light leading-relaxed text-white/80 text-sm md:max-w-md md:text-base">
                  Automatic Pasta Maker: Fresh texture, zero effort.
                </p>
              </div>

              {/* 价格 + 加购 + 链接 */}
              <div className="flex flex-wrap items-center gap-4">
                {/* 价格模块 */}
                <div className="flex items-baseline gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
                  <span className="text-xl font-bold text-white">$229.99</span>
                  <span className="text-sm text-white/60 line-through">
                    $279.99
                  </span>
                </div>

                {/* 加购按钮 */}
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand/90 active:scale-95"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          {/* 右侧双卡片 */}
          <div ref={rightRef} className="flex flex-1 flex-col gap-5 md:gap-6">
            {/* ② Blog 分类卡片 — 带背景图 */}
            <Link
              href="/blog"
              className="group relative flex min-h-[260px] flex-1 overflow-hidden rounded-3xl lg:min-h-[280px]"
            >
              {/* 背景图 */}
              <Image
                src="/images/recipe_2.jpg"
                alt="Kitchen Blog"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
              {/* 遮罩 — 左侧较深便于文字阅读 */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

              {/* 文字内容 */}
              <div className="relative flex h-full flex-col justify-between p-8 md:p-9">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 md:text-xs">
                  Latest Articles
                </span>
                <div className="w-full">
                  <h4 className="mb-5 text-xl font-light leading-snug text-white md:text-2xl">
                    Kitchen Stories & Tips
                  </h4>
                  <span className="text-sm font-medium text-white/90">
                    Read Blog
                  </span>
                </div>
              </div>

              {/* 箭头 — 定位到遮罩右侧 */}
              <div className="absolute bottom-8 right-8 z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-all group-hover:bg-brand group-hover:border-brand md:bottom-9 md:right-9">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>

            {/* ③ 食谱分类卡片 — 带背景图 */}
            <Link
              href="/recipes"
              className="group relative flex min-h-[260px] flex-1 overflow-hidden rounded-3xl lg:min-h-[280px]"
            >
              {/* 背景图 */}
              <Image
                src="/images/recipe_1.jpg"
                alt="Recipes"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
              {/* 遮罩 — 底部深，顶部浅 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

              {/* 文字内容 */}
              <div className="relative flex h-full flex-col justify-between p-8 md:p-9">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 md:text-xs">
                  Seasonal Recipes
                </span>
                <div className="w-full">
                  <h4 className="mb-5 text-xl font-light leading-snug text-white md:text-2xl">
                    Homemade Delights
                  </h4>
                  <span className="text-sm font-medium text-white/90">
                    Browse Recipes
                  </span>
                </div>
              </div>

              {/* 箭头 — 定位到遮罩右侧 */}
              <div className="absolute bottom-8 right-8 z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-all group-hover:bg-white group-hover:text-ink md:bottom-9 md:right-9">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
