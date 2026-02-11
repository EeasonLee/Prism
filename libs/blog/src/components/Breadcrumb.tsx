import type { Route } from 'next';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/** Mobile: single "Back to [parent]" link + current page label. Desktop: full trail. */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const currentItem = items[items.length - 1];
  const parentItem = items.length >= 2 ? items[items.length - 2] : null;

  return (
    <nav
      className="flex min-w-0 items-center overflow-hidden text-sm"
      aria-label="Breadcrumb"
    >
      {/* Mobile: Back to parent + current (both truncate when needed) */}
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden md:hidden">
        {parentItem && (
          <Link
            href={parentItem.href as Route}
            className="min-w-0 flex-1 truncate text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            title={`Back to ${parentItem.label}`}
          >
            Back to {parentItem.label}
          </Link>
        )}
        <span
          className="min-w-0 max-w-[55%] shrink-0 truncate text-gray-900 font-medium"
          title={currentItem.label}
        >
          {currentItem.label}
        </span>
      </div>

      {/* Desktop: full breadcrumb trail */}
      <div className="hidden items-center space-x-2 md:flex">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={item.href} className="flex items-center space-x-2">
              {index > 0 && (
                <span className="text-gray-400" aria-hidden="true">
                  &gt;
                </span>
              )}
              {isLast ? (
                <span className="text-gray-900 font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href as Route}
                  className="text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
