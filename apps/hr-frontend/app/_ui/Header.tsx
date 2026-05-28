import Link from 'next/link';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/categories', label: '分类' },
  { href: '/search', label: '搜索' },
  { href: '/cart', label: '购物车' },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand">
          华人商城
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            账户
          </Link>
          <Link
            href="/cart"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            购物车
          </Link>
        </div>
      </div>
    </header>
  );
}
