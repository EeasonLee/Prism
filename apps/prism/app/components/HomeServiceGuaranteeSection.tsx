'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Headphones, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    id: 1,
    icon: Truck,
    title: 'Free Shipping',
    description: 'Free Shipping On All Orders to the US',
  },
  {
    id: 2,
    icon: RefreshCw,
    title: 'Money Guarantee',
    description: '30-day Money-back Satisfaction Guarantee',
  },
  {
    id: 3,
    icon: Headphones,
    title: 'Customer Support',
    description: 'Consistently Superior & Efficient Service',
  },
  {
    id: 4,
    icon: ShieldCheck,
    title: 'Quality Assurance',
    description: '1-Year Limited Warranty on All Products',
  },
];

export function HomeServiceGuaranteeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current;

    if (!section || !cards) return;

    const ctx = gsap.context(() => {
      const cardElements = cards.querySelectorAll('.service-card');
      gsap.fromTo(
        cardElements,
        { y: '6vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
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
      className="relative w-full overflow-hidden bg-[#F6F6F2] py-16 lg:py-20"
    >
      <div className="w-full px-6 lg:px-[8vw]">
        <div
          ref={cardsRef}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6"
        >
          {services.map(service => (
            <div
              key={service.id}
              className="service-card flex flex-col items-center rounded-[24px] bg-white p-6 text-center card-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl lg:p-8"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D94F25]/10">
                <service.icon className="h-7 w-7 text-[#D94F25]" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-[#111] lg:text-lg">
                {service.title}
              </h3>
              <p className="text-sm text-[#6B6B6B]">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
