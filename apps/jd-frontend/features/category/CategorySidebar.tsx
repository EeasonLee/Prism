import Link from 'next/link';
import type { Route } from 'next';
import type { CategoryTreeNode } from '@/features/category/types';

interface CategorySidebarProps {
  categories: CategoryTreeNode[];
  activeCategoryId?: number;
}

function CategoryItem({
  cat,
  activeCategoryId,
  depth = 0,
}: {
  cat: CategoryTreeNode;
  activeCategoryId?: number;
  depth?: number;
}) {
  if (!cat.isActive) return null;

  const isActive = cat.id === activeCategoryId;
  const children = cat.children ?? [];
  const hasChildren = children.length > 0;

  return (
    <li>
      <Link
        href={`/categories/${cat.slug ?? cat.id}` as Route}
        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
          isActive
            ? 'bg-brand/10 font-semibold text-brand'
            : 'text-ink-muted hover:bg-surface hover:text-ink'
        } ${depth > 0 ? 'ml-3' : ''}`}
      >
        <span className="truncate">{cat.name}</span>
        {cat.productCount > 0 && (
          <span className="ml-2 shrink-0 text-xs text-ink-muted/60">
            {cat.productCount}
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
  categories: CategoryTreeNode[]
): CategoryTreeNode[] {
  const active = categories.filter(c => c.isActive);

  if (active.length === 0 && categories.length > 0) {
    return categories.flatMap(c => findEffectiveCategories(c.children ?? []));
  }

  if (
    active.length === 1 &&
    active[0].productCount === 0 &&
    (active[0].children ?? []).length > 0
  ) {
    return findEffectiveCategories(active[0].children);
  }

  return active;
}

export function CategorySidebar({
  categories,
  activeCategoryId,
}: CategorySidebarProps) {
  const topLevel = findEffectiveCategories(categories);

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
