import Link from 'next/link';
import type { Route } from 'next';
import type { MagentoCategoryTree } from '../../../lib/api/magento/types';

interface CategorySidebarProps {
  tree: MagentoCategoryTree;
  activeCategoryId?: number;
}

function CategoryItem({
  cat,
  activeCategoryId,
  depth = 0,
}: {
  cat: MagentoCategoryTree;
  activeCategoryId?: number;
  depth?: number;
}) {
  if (!cat.is_active) return null;

  const isActive = cat.id === activeCategoryId;
  const children = cat.children ?? [];
  const hasChildren = children.length > 0;

  return (
    <li>
      <Link
        href={`/shop/${cat.id}` as Route}
        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
          isActive
            ? 'bg-brand/10 font-semibold text-brand'
            : 'text-ink-muted hover:bg-surface hover:text-ink'
        } ${depth > 0 ? 'ml-3' : ''}`}
      >
        <span className="truncate">{cat.name}</span>
        {cat.product_count > 0 && (
          <span className="ml-2 shrink-0 text-xs text-ink-muted/60">
            {cat.product_count}
          </span>
        )}
      </Link>

      {hasChildren && (
        <ul className="mt-0.5 space-y-0.5">
          {children.map(child => (
            <CategoryItem
              key={child.id}
              cat={child}
              activeCategoryId={activeCategoryId}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function findEffectiveCategories(
  node: MagentoCategoryTree
): MagentoCategoryTree[] {
  const children = node.children ?? [];
  const active = children.filter(c => c.is_active);

  if (active.length === 0 && children.length > 0) {
    return children.flatMap(c => findEffectiveCategories(c));
  }

  if (
    active.length === 1 &&
    active[0].product_count === 0 &&
    (active[0].children ?? []).length > 0
  ) {
    return findEffectiveCategories(active[0]);
  }

  return active;
}

export function CategorySidebar({
  tree,
  activeCategoryId,
}: CategorySidebarProps) {
  const topLevel = findEffectiveCategories(tree);

  return (
    <nav aria-label="Product categories" className="w-full">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Categories
      </p>
      <ul className="space-y-0.5">
        <li>
          <Link
            href="/shop"
            className={`flex items-center rounded-lg px-3 py-2 text-sm transition ${
              !activeCategoryId
                ? 'bg-brand/10 font-semibold text-brand'
                : 'text-ink-muted hover:bg-surface hover:text-ink'
            }`}
          >
            All Products
          </Link>
        </li>
        {topLevel.map(cat => (
          <CategoryItem
            key={cat.id}
            cat={cat}
            activeCategoryId={activeCategoryId}
          />
        ))}
      </ul>
    </nav>
  );
}
