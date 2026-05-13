'use client';

import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { resolveImageUrl } from '@prism/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CategoryFilterScrollerItem {
  id: number;
  name: string;
  listImageUrl: string | null;
}

interface CategoryFilterScrollerProps {
  sections: CategoryFilterScrollerItem[];
}

function CategoryFilterItem({
  section,
}: {
  section: CategoryFilterScrollerItem;
}) {
  const imageUrl =
    resolveImageUrl(section.listImageUrl) ?? section.listImageUrl;

  return (
    <Link
      href={`#mall-category-${section.id}`}
      className="flex shrink-0 flex-col items-center gap-2 transition hover:opacity-85"
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-full border border-line bg-bg-subtle sm:h-20 sm:w-20">
        {imageUrl ? (
          <OptimizedImage
            src={imageUrl}
            alt={section.name}
            fill
            maxDisplayWidth={80}
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-muted">
            N/A
          </div>
        )}
      </div>
      <span className="max-w-[88px] text-center text-xs font-medium text-ink sm:max-w-[108px] sm:text-sm">
        {section.name}
      </span>
    </Link>
  );
}

export function CategoryFilterScroller({
  sections,
}: CategoryFilterScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbWidth, setThumbWidth] = useState(28);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);

  const updateIndicator = useCallback(() => {
    const scroller = scrollRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;

    const { scrollLeft, scrollWidth, clientWidth } = scroller;
    const trackWidth = track.clientWidth;
    const hasOverflow = scrollWidth > clientWidth + 1;

    if (!hasOverflow || trackWidth <= 0) {
      setShowIndicator(false);
      setThumbOffset(0);
      return;
    }

    setShowIndicator(true);

    const ratio = clientWidth / scrollWidth;
    const nextThumbWidth = Math.max(
      20,
      Math.min(trackWidth, trackWidth * ratio)
    );
    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    const maxOffset = Math.max(0, trackWidth - nextThumbWidth);

    setThumbWidth(nextThumbWidth);
    setThumbOffset(maxOffset * progress);
  }, []);

  useEffect(() => {
    updateIndicator();
    const scroller = scrollRef.current;
    if (!scroller) return;

    const handleScroll = () => updateIndicator();
    scroller.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new ResizeObserver(() => updateIndicator());
    observer.observe(scroller);
    if (trackRef.current) {
      observer.observe(trackRef.current);
    }

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [updateIndicator]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-4 sm:gap-6 sm:pb-2"
      >
        {sections.map(section => (
          <CategoryFilterItem key={section.id} section={section} />
        ))}
      </div>

      <div
        ref={trackRef}
        className="absolute bottom-1 left-1/2 h-0.5 w-14 -translate-x-1/2 rounded-full bg-border/60 sm:hidden"
      >
        {showIndicator && (
          <div
            className="h-full rounded-full bg-ink/70 transition-transform duration-150"
            style={{
              width: `${thumbWidth}px`,
              transform: `translateX(${thumbOffset}px)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
