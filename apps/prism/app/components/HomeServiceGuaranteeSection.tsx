import { Headphones, RefreshCw, ShieldCheck, Truck } from 'lucide-react';

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
  return (
    <section
      aria-labelledby="peace-of-mind-heading"
      className="relative w-full overflow-hidden bg-surface py-12 lg:py-20"
    >
      <div className="w-full px-6 lg:px-[8vw]">
        {/* 导语版块 */}
        <h2
          id="peace-of-mind-heading"
          className="heading-3 mb-8 text-center text-ink"
        >
          Peace of Mind
        </h2>

        {/* 服务项：扁平布局，无卡片 */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {services.map(service => (
            <div
              key={service.id}
              className="flex flex-col items-center text-center"
            >
              <service.icon
                className="mb-4 h-10 w-10 text-brand lg:h-12 lg:w-12"
                strokeWidth={1.5}
              />
              <h3 className="mb-2 text-base font-semibold text-ink lg:text-lg">
                {service.title}
              </h3>
              <p className="text-sm text-ink-muted">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
