import Link from 'next/link';
import { PageContainer } from '@prism/ui';

const navItems: Array<{ href: '/'; label: string }> = [
  { href: '/', label: 'Home' },
];

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <PageContainer className="flex min-h-16 items-center justify-between gap-6 py-3">
        <Link href="/" className="text-base font-semibold text-foreground">
          Prism
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-4"
        >
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </PageContainer>
    </header>
  );
}
