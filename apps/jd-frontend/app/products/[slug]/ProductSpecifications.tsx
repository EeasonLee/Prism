import type { ProductSpecificationGroup } from '@/features/product/enrichment.api';

interface ProductSpecificationsProps {
  groups: ProductSpecificationGroup[];
}

export function ProductSpecifications({ groups }: ProductSpecificationsProps) {
  if (groups.length === 0) return null;

  return (
    <section
      aria-labelledby="product-specifications-heading"
      className="py-12 lg:py-16"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="product-specifications-heading"
          className="heading-3 mb-8 text-center text-ink"
        >
          Specifications
        </h2>

        <div className="space-y-8">
          {groups.map(group => (
            <div
              key={group.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="border-b border-border bg-surface-muted px-5 py-4 sm:px-6">
                <h3 className="text-base font-semibold text-ink sm:text-lg">
                  {group.title}
                </h3>
              </div>

              <dl className="divide-y divide-border">
                {group.rows.map(row => (
                  <div
                    key={`${group.id}-${row.key}`}
                    className={`grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-6 sm:px-6 ${
                      row.highlighted ? 'bg-brand/5' : ''
                    }`}
                  >
                    <dt className="text-sm font-medium text-ink-muted">
                      {row.label}
                    </dt>
                    <dd className="text-sm leading-6 text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
