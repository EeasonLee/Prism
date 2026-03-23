'use client';

import { ArrowRight, Check } from 'lucide-react';
import Image from 'next/image';
import type { FeaturedProductsProps } from '@/lib/api/cms-page.types';

export function FeaturedProducts({
  title,
  subtitle,
  products,
}: FeaturedProductsProps) {
  return (
    <section className="relative w-full bg-surface py-12 lg:py-20">
      <div className="w-full px-5 sm:px-6 lg:px-[8vw]">
        <div className="mb-8">
          {subtitle && (
            <span className="micro-text mb-2 block text-brand">{subtitle}</span>
          )}
          <h2
            className="heading-3 text-ink"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {products.map(product => (
            <div
              key={product.id}
              className="group overflow-hidden rounded-2xl border border-border bg-white"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-square w-full shrink-0 overflow-hidden sm:w-[240px] lg:w-[280px]">
                  <Image
                    src={product.image.url}
                    alt={product.image.alternativeText || product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 280px"
                  />
                  {product.label && (
                    <div className="absolute left-3 top-3 rounded bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {product.label}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-5 lg:p-6">
                  <div>
                    <h3
                      className="mb-2 text-lg font-bold leading-snug text-ink lg:text-xl"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="mb-4 text-sm leading-relaxed text-ink-muted">
                        {product.description}
                      </p>
                    )}

                    {product.features.length > 0 && (
                      <ul className="mb-5 space-y-1.5">
                        {product.features.map((f, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10">
                              <Check className="h-2.5 w-2.5 text-brand" />
                            </div>
                            <span className="text-sm text-ink">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    {(product.price || product.originalPrice) && (
                      <div className="mb-4 flex items-center gap-3">
                        {product.price && (
                          <span className="text-2xl font-bold text-brand">
                            ${product.price}
                          </span>
                        )}
                        {product.originalPrice && (
                          <span className="text-sm text-ink-faint line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                        {product.discount && (
                          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                            Save {product.discount}%
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-sm"
                      >
                        Add to Cart
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      {product.productLink && (
                        <a
                          href={product.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
                        >
                          Learn More
                        </a>
                      )}
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
