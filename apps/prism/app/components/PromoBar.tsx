export function PromoBar() {
  return (
    <div
      className="flex items-center justify-center bg-brand py-2.5 text-center text-sm font-medium text-brand-foreground"
      role="complementary"
      aria-label="Promotional offer"
    >
      Free standard shipping on subscriptions and orders over $49
    </div>
  );
}
