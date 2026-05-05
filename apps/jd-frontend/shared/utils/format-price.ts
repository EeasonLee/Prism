export function normalizeCurrencyCode(
  currency: string | null | undefined,
  fallback = 'USD'
): string {
  const normalized = currency?.trim().toUpperCase();
  return normalized && normalized.length === 3 ? normalized : fallback;
}

export function formatPrice(
  value: number,
  currency: string | null | undefined,
  locale = 'en-US'
): string {
  const currencyCode = normalizeCurrencyCode(currency);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}
