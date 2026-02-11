'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sliders, Sparkles, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Volume2,
    title: 'Quiet Performance',
    description: "Low-noise motors that won't wake the house.",
  },
  {
    icon: Sparkles,
    title: 'Easy Cleanup',
    description: 'Dishwasher-safe parts and wipe-clean surfaces.',
  },
  {
    icon: Sliders,
    title: 'Smart Design',
    description: 'Compact footprints with intuitive controls.',
  },
];

export function HomeModernLivingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const featuresEl = featuresRef.current;
    const image = imageRef.current;

    if (!section || !headline || !featuresEl || !image) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headline,
        { y: '8vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 50%',
            scrub: true,
          },
        }
      );

      const featureItems = featuresEl.querySelectorAll('.feature-item');
      gsap.fromTo(
        featureItems,
        { x: '-6vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: featuresEl,
            start: 'top 80%',
            end: 'top 50%',
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        image,
        { x: '10vw', opacity: 0, scale: 0.98 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'top 40%',
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        image,
        { y: 0 },
        {
          y: '-3vh',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 40%',
            end: 'bottom 20%',
            scrub: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden bg-[#F6F6F2] py-20 lg:py-32"
    >
      <div className="w-full px-6 lg:px-[6vw]">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="lg:w-[46vw]">
            <div ref={headlineRef} className="mb-12">
              <h2 className="heading-2 mb-4 text-[#111]">
                Made for Modern Living
              </h2>
              <p className="body-text max-w-lg text-[#6B6B6B]">
                Thoughtful engineering, quiet performance, and details that fit
                your space.
              </p>
            </div>

            <div ref={featuresRef} className="space-y-6">
              {features.map(feature => (
                <div
                  key={feature.title}
                  className="feature-item flex items-start gap-4 rounded-[18px] p-4 transition-colors hover:bg-white/50"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#D94F25]/10">
                    <feature.icon className="h-5 w-5 text-[#D94F25]" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-[#111]">
                      {feature.title}
                    </h3>
                    <p className="body-text text-[#6B6B6B]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={imageRef}
            className="lg:h-[64vh] lg:w-[40vw] overflow-hidden rounded-[28px]"
          >
            <Image
              src="/images/modern_living_img.jpg"
              alt="Modern kitchen lifestyle"
              width={800}
              height={640}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
