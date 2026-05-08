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

  // 快照：挂载时的 history 是上一页的导航记录，先存下来再让 track 改写
  const prevSnapshot = useRef(history).current;

  // URL 变化时更新 store（覆盖筛选参数变化等场景），防重复
  const lastTrackedUrlRef = useRef('');
  useEffect(() => {
    if (items.length > 0) {
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl !== lastTrackedUrlRef.current) {
        lastTrackedUrlRef.current = currentUrl;
        track(items, currentUrl);
      }
    }
  });

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

  // 用快照（上一页的导航记录）+ props 合并出当前面包屑
  const resolvedItems = resolveItems(items, prevSnapshot);

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
 * 合并 prevHistory（上一页的导航记录）与 props（当前页数据），产出最终面包屑。
 *
 * 三条规则，按优先级：
 *
 * 规则1 — 回退：当前页 label 已在 history 中出现过 → 截断到该位置
 *  例：Home / Dough Makers / Product → 点返回 → Home / Dough Makers
 *
 * 规则2 — 深入：history 比 props 少一级 → 用户从上一页"深入"到当前页
 *  用 history 祖先（真实导航路径），忽略 props 的分类名（产品数据可能返回父分类）
 *  例：Dough Makers 分类 → 产品详情 → Home / Dough Makers / Product
 *
 * 规则3 — 其他：history 为空（直接访问/首页）、跨分支跳转、同级跳转
 *  全用 props 数据驱动的值
 *  例：直接访问产品 → Home / Kitchen appliances / Product
 *  例：跨分类跳 → Home / Kitchen appliances
 *  例：相关商品 → Home / Kitchen appliances / Product B
 */
function resolveItems(
  propsItems: BreadcrumbItem[],
  prevHistory: BreadcrumbItem[]
): BreadcrumbItem[] {
  // 规则3：无历史 → 全用 props
  if (prevHistory.length === 0) return propsItems;

  const propsCurrent = propsItems[propsItems.length - 1];

  // 规则1：回退 → 截断
  const backIndex = prevHistory.findIndex(h => h.label === propsCurrent.label);
  if (backIndex >= 0) {
    const result: BreadcrumbItem[] = prevHistory
      .slice(0, backIndex + 1)
      .map(h => ({ ...h }));
    result[result.length - 1] = { label: propsCurrent.label };
    return result;
  }

  // 规则2：深入 → history 祖先 + props 当前页
  if (prevHistory.length === propsItems.length - 1) {
    const result: BreadcrumbItem[] = prevHistory.map(h => ({ ...h }));
    result.push({ label: propsCurrent.label });
    return result;
  }

  // 规则3：其他 → 全用 props
  return propsItems;
}
