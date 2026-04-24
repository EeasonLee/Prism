import { formatPrice } from '@/lib/format-price';

export function PromoBar() {
  return (
    <div
      className="flex items-center justify-center overflow-x-auto overflow-y-hidden bg-brand px-3 py-2 text-center text-[11px] font-medium leading-none text-brand-foreground [scrollbar-width:none] whitespace-nowrap sm:text-sm [&::-webkit-scrollbar]:hidden"
      role="complementary"
      aria-label="Promotional offer"
    >
      {`Free standard shipping on subscriptions and orders over ${formatPrice(
        49,
        'USD'
      )}`}
    </div>
  );
}
