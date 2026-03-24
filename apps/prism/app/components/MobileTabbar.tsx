'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@prism/shared';
import { useAuth } from '../../lib/auth/context';
import { useAuthModal } from '../../lib/auth-modal/context';
import { useCart } from '../../lib/cart/context';
import {
  getNavBadgeValue,
  MOBILE_TABBAR_ITEMS,
  shouldHideMobileTabbar,
} from './nav-config';

export function MobileTabbar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const { itemCount, openCart } = useCart();

  if (shouldHideMobileTabbar(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
    >
      <div className="grid h-[var(--mobile-tabbar-height)] grid-cols-4 px-2 pb-[var(--mobile-safe-area-bottom)]">
        {MOBILE_TABBAR_ITEMS.map(item => {
          const isActive = item.match(pathname);
          const Icon = item.icon;
          const itemClassName = cn(
            'flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors',
            isActive ? 'text-brand' : 'text-ink-muted hover:text-ink'
          );
          const badge = item.key === 'cart' ? getNavBadgeValue(itemCount) : undefined;

          if (item.key === 'cart') {
            return (
              <button
                key={item.key}
                type="button"
                aria-label="Open cart"
                onClick={openCart}
                className={itemClassName}
              >
                <span className="relative flex items-center justify-center">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {badge ? (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-brand-foreground">
                      {badge}
                    </span>
                  ) : null}
                </span>
                <span>{item.label}</span>
              </button>
            );
          }

          if (item.key === 'account') {
            return (
              <button
                key={item.key}
                type="button"
                aria-label={isAuthenticated && user ? `Signed in as ${user.email}` : 'Sign in'}
                onClick={() => openLogin('signin')}
                className={itemClassName}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href ?? '/'}
              aria-current={isActive ? 'page' : undefined}
              className={itemClassName}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
