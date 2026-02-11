'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';
import { HomeCategorySection } from './HomeCategorySection';
import { HomeFeaturedProduct } from './HomeFeaturedProduct';
import { HomeFeaturedProduct2 } from './HomeFeaturedProduct2';
import { HomeFirstHeroSection } from './HomeFirstHeroSection';
import { HomeHeroCarousel } from './HomeHeroCarousel';
import { HomeModernLivingSection } from './HomeModernLivingSection';
import { HomeProductListSection } from './HomeProductListSection';
import { HomeRecipeBlogSection } from './HomeRecipeBlogSection';
import { HomeServiceGuaranteeSection } from './HomeServiceGuaranteeSection';

gsap.registerPlugin(ScrollTrigger);

export function HomePageClient() {
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="grain-overlay">
      <main className="relative">
        <HomeHeroCarousel />
        <HomeFirstHeroSection />
        <HomeFeaturedProduct />
        <HomeFeaturedProduct2 />
        <HomeCategorySection />
        <HomeRecipeBlogSection />
        <HomeProductListSection />
        <HomeServiceGuaranteeSection />
        <HomeModernLivingSection />
      </main>
    </div>
  );
}
