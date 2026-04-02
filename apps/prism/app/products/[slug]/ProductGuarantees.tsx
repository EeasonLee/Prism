import {
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  type LucideIcon,
} from 'lucide-react';
import type { Guarantee } from './mock-data';

const ICON_MAP: Record<string, LucideIcon> = {
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
};

interface ProductGuaranteesProps {
  guarantees: Guarantee[];
}

export function ProductGuarantees({ guarantees }: ProductGuaranteesProps) {
  return (
    <section
      aria-labelledby="guarantees-heading"
      className="rounded-2xl bg-surface py-8 lg:py-10"
    >
      <h2 id="guarantees-heading" className="sr-only">
        Product Guarantees
      </h2>
      <div className="grid grid-cols-2 gap-6 px-6 lg:grid-cols-4 lg:gap-8 lg:px-10">
        {guarantees.map((item, idx) => {
          const Icon = ICON_MAP[item.icon] ?? ShieldCheck;
          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-2 text-center"
            >
              <Icon
                className="h-8 w-8 text-brand lg:h-10 lg:w-10"
                strokeWidth={1.5}
              />
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="text-xs text-ink-muted">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
