'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@prism/shared';
import { useBreadcrumbStore, type BreadcrumbItem } from './useBreadcrumbStore';

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

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const history = useBreadcrumbStore(s => s.history);
  const track = useBreadcrumbStore(s => s.track);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLOListElement>(null);

  // 挂载时将当前页面 items + URL 写入 store
  useEffect(() => {
    if (items.length > 0) {
      const currentUrl = window.location.pathname + window.location.search;
      track(items, currentUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在挂载时执行一次

  // 展开时自动滚动到末尾（必须在条件 return 之前，React hooks 规则）
  const scrollToEnd = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    if (expanded) {
      scrollToEnd();
    }
  }, [expanded, scrollToEnd]);

  // 合并：优先使用 history 中同名 label 的 href
  const resolvedItems = resolveItems(items, history);

  if (!resolvedItems || resolvedItems.length === 0) {
    return null;
  }

  const isCollapsible = resolvedItems.length >= 3;

  return (
    <nav className={cn('min-w-0 text-sm', className)} aria-label="Breadcrumb">
      {/* ---- 桌面端：完整路径 ---- */}
      <ol className="hidden items-center gap-2 md:flex">
        {resolvedItems.map((item, index) => (
          <BreadcrumbListItem
            key={item.label + index}
            item={item}
            isFirst={index === 0}
            isLast={index === resolvedItems.length - 1}
          />
        ))}
      </ol>

      {/* ---- 移动端 ---- */}
      {isCollapsible ? (
        <div className="flex md:hidden">
          {expanded ? (
            /* 展开态：横向滚动完整路径 */
            <ol
              ref={scrollRef}
              role="list"
              className="no-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap"
            >
              {resolvedItems.map((item, index) => (
                <BreadcrumbListItem
                  key={item.label + index}
                  item={item}
                  isFirst={index === 0}
                  isLast={index === resolvedItems.length - 1}
                />
              ))}
            </ol>
          ) : (
            /* 折叠态：首项 / ... / 当前项 */
            <ol className="flex items-center gap-2">
              <li>
                <Link
                  href={resolvedItems[0].href as Route}
                  className="text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {resolvedItems[0].label}
                </Link>
              </li>
              <li>
                <span className="text-ink-faint" aria-hidden="true">
                  /
                </span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  aria-label="Show full breadcrumb path"
                >
                  …
                </button>
              </li>
              <li>
                <span className="text-ink-faint" aria-hidden="true">
                  /
                </span>
              </li>
              <li>
                <span className="text-ink font-medium" aria-current="page">
                  {resolvedItems[resolvedItems.length - 1].label}
                </span>
              </li>
            </ol>
          )}
        </div>
      ) : (
        /* items ≤ 2：移动端同桌面 */
        <ol className="flex items-center gap-2 md:hidden">
          {resolvedItems.map((item, index) => (
            <BreadcrumbListItem
              key={item.label + index}
              item={item}
              isFirst={index === 0}
              isLast={index === resolvedItems.length - 1}
            />
          ))}
        </ol>
      )}
    </nav>
  );
}

/**
 * 合并策略：history 中有相同 label 的项 → 用 history 的 href（保留筛选参数），
 * history 中没有的 → 用 props 的值。
 * 如果 history 为空（直接访问），全部用 props。
 */
function resolveItems(
  propsItems: BreadcrumbItem[],
  history: BreadcrumbItem[]
): BreadcrumbItem[] {
  if (history.length === 0) return propsItems;

  return propsItems.map(item => {
    const historyMatch = history.find(h => h.label === item.label);
    if (historyMatch?.href) {
      return { ...item, href: historyMatch.href };
    }
    return item;
  });
}
