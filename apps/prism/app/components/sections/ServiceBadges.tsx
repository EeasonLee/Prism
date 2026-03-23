import { Headphones, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import type { ServiceBadgesProps } from '@/lib/api/cms-page.types';

const ICON_MAP = {
  shield: ShieldCheck,
  truck: Truck,
  refresh: RefreshCw,
  headset: Headphones,
};

export function ServiceBadges({ badges }: ServiceBadgesProps) {
  return (
    <section className="py-12 lg:py-20">
      <div className="px-6 lg:px-[8vw]">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {badges.map(badge => {
            const Icon = ICON_MAP[badge.icon];
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center text-center"
              >
                <Icon
                  className="mb-4 h-10 w-10 text-brand lg:h-12 lg:w-12"
                  strokeWidth={1.5}
                />
                <h3 className="mb-2 text-base font-semibold text-ink lg:text-lg">
                  {badge.title}
                </h3>
                <p className="text-sm text-ink-muted">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
