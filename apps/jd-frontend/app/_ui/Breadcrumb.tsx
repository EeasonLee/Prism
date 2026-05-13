'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { cn } from '@prism/shared';

const LINK_CLASS =
  'text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

function BreadcrumbListItem({
  item,
  isFirst,
  isLast,
}: {
  item: BreadcrumbItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      {!isFirst && (
        <span className="text-ink-faint" aria-hidden="true">
          /
        </span>
      )}
      {isLast ? (
        <span className="text-ink font-medium" aria-current="page">
          {item.label}
        </span>
      ) : (
        <Link href={item.href as Route} className={LINK_CLASS}>
          {item.label}
        </Link>
      )}
    </li>
  );
}

export type { BreadcrumbItem };

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const isCollapsible = items.length >= 3;

  return (
    <nav className={cn('min-w-0 text-sm', className)} aria-label="Breadcrumb">
      {/* ---- 桌面端：完整路径 ---- */}
      <ol className="hidden items-center gap-2 md:flex">
        {items.map((item, index) => (
          <BreadcrumbListItem
            key={item.label + index}
            item={item}
            isFirst={index === 0}
            isLast={index === items.length - 1}
          />
        ))}
      </ol>

      {/* ---- 移动端 ---- */}
      {isCollapsible ? (
        <div className="flex md:hidden">
          <ol className="flex min-w-0 items-center gap-2">
            <li className="shrink-0">
              <Link
                href={items[0].href as Route}
                className="text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {items[0].label}
              </Link>
            </li>
            <li className="shrink-0">
              <span className="text-ink-faint" aria-hidden="true">
                /
              </span>
            </li>
            <li className="shrink-0 max-w-[5.5rem]">
              {items[items.length - 2].href ? (
                <Link
                  href={items[items.length - 2].href as Route}
                  className="block truncate text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {items[items.length - 2].label}
                </Link>
              ) : (
                <span className="block truncate text-ink-muted">
                  {items[items.length - 2].label}
                </span>
              )}
            </li>
            <li className="shrink-0">
              <span className="text-ink-faint" aria-hidden="true">
                /
              </span>
            </li>
            <li className="min-w-0">
              <span
                className="block truncate text-ink font-medium"
                aria-current="page"
              >
                {items[items.length - 1].label}
              </span>
            </li>
          </ol>
        </div>
      ) : (
        /* items ≤ 2：移动端同桌面 */
        <ol className="flex items-center gap-2 md:hidden">
          {items.map((item, index) => (
            <BreadcrumbListItem
              key={item.label + index}
              item={item}
              isFirst={index === 0}
              isLast={index === items.length - 1}
            />
          ))}
        </ol>
      )}
    </nav>
  );
}
