'use client';

import { useEffect, useRef, useState } from 'react';

interface ProductDetailsSectionProps {
  detailsHtml: string;
}

const PRODUCT_DETAILS_COLLAPSED_HEIGHT = 180;
const EXPAND_THRESHOLD_TOLERANCE = 8;

export function ProductDetailsSection({
  detailsHtml,
}: ProductDetailsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const detailsElement = contentRef.current;
    if (!detailsElement) {
      setCanExpand(false);
      return;
    }

    const updateExpandableState = () => {
      const fullHeight = detailsElement.scrollHeight;
      setCanExpand(
        fullHeight >
          PRODUCT_DETAILS_COLLAPSED_HEIGHT + EXPAND_THRESHOLD_TOLERANCE
      );
    };

    updateExpandableState();

    const resizeObserver = new ResizeObserver(() => {
      updateExpandableState();
    });
    resizeObserver.observe(detailsElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [detailsHtml]);

  useEffect(() => {
    setIsExpanded(false);
  }, [detailsHtml]);

  useEffect(() => {
    if (!canExpand && isExpanded) {
      setIsExpanded(false);
    }
  }, [canExpand, isExpanded]);

  return (
    <section
      id="section-details"
      className="mt-6 border-t border-border pt-6 lg:mt-8"
    >
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="mb-3 text-lg font-semibold text-ink">Product details</h2>

        <div className="relative">
          <div
            id="product-details-content"
            ref={contentRef}
            className={`prose prose-sm max-w-none text-ink [&_li]:my-0.5 [&_ul]:pl-4 [&_strong]:font-semibold transition-[max-height] duration-300 ${
              !isExpanded && canExpand ? 'max-h-[240px] overflow-hidden' : ''
            }`}
            dangerouslySetInnerHTML={{ __html: detailsHtml }}
          />

          {!isExpanded && canExpand && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-24 items-end justify-center bg-gradient-to-t from-background via-background/20 to-transparent pb-4">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-border bg-background/95 px-4 py-2 text-sm font-medium text-ink shadow-sm backdrop-blur-sm transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                aria-expanded={false}
                aria-controls="product-details-content"
              >
                Show more
              </button>
            </div>
          )}
        </div>

        {canExpand && isExpanded && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-expanded={isExpanded}
              aria-controls="product-details-content"
            >
              Show less
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
