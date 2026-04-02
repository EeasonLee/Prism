import {
  Flame,
  LeafyGreen,
  Zap,
  Droplets,
  Star,
  Shield,
  Clock,
  Thermometer,
  type LucideIcon,
} from 'lucide-react';
import type { KeyPoint } from './mock-data';

// 支持的 icon 名称映射
const ICON_MAP: Record<string, LucideIcon> = {
  Flame,
  LeafyGreen,
  Zap,
  Droplets,
  Star,
  Shield,
  Clock,
  Thermometer,
};

interface SellingPointsProps {
  points: KeyPoint[];
}

export function SellingPoints({ points }: SellingPointsProps) {
  return (
    <section
      aria-labelledby="selling-points-heading"
      className="py-12 lg:py-16"
    >
      <h2
        id="selling-points-heading"
        className="heading-3 mb-10 text-center text-ink"
      >
        Why You'll Love It
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {points.map((point, idx) => {
          const Icon = ICON_MAP[point.icon] ?? Zap;
          return (
            <div
              key={idx}
              className="flex flex-col items-start rounded-2xl border border-border bg-surface p-6 transition hover:border-brand/30 hover:shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
                <Icon className="h-6 w-6 text-brand" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-ink">
                {point.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                {point.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
