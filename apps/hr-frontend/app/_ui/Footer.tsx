import Link from 'next/link';

const footerLinks = [
  { href: '/about', label: '关于我们' },
  { href: '/contact', label: '联系我们' },
  { href: '/shipping', label: '配送说明' },
  { href: '/returns', label: '退换政策' },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-lg font-bold text-brand">华人商城</p>
            <p className="mt-2 max-w-sm text-sm text-ink-muted">
              优质华人生活好物，服务北美华人社区。
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ink-muted hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-border pt-6 text-center text-xs text-ink-faint">
          © {new Date().getFullYear()} Huaren Store. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
