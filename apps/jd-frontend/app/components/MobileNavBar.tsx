'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { HeaderMenuNode } from '@/lib/api/bff/navigation/types';
import { useAuth } from '../../lib/auth/context';
import { useCart } from '../../lib/cart/context';
import { getNavBadgeValue } from './nav-config';
import { GlobalSearch } from './GlobalSearch';

function MobileIconButton({
  label,
  badge,
  onClick,
  children,
}: {
  label: string;
  badge?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-ink-muted transition hover:border-brand/30 hover:bg-brand/10 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-brand-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

interface MobileNavBarProps {
  menuItems: HeaderMenuNode[];
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('//');
}

function normalizeHref(url: string): string {
  if (isExternalUrl(url)) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

export function MobileNavBar({ menuItems }: MobileNavBarProps) {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="flex h-[73px] items-center justify-between gap-3 px-4 sm:px-6 md:hidden">
        <Link
          href="/"
          aria-label="Go to home page"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/images/logo.png"
            alt="Joydeem"
            width={132}
            height={44}
            className="h-11 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          <MobileIconButton
            label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen(open => !open)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </MobileIconButton>

          <MobileIconButton
            label="Search"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </MobileIconButton>

          <MobileIconButton
            label="Open cart"
            badge={getNavBadgeValue(itemCount)}
            onClick={openCart}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          </MobileIconButton>

          <MobileIconButton
            label={
              isAuthenticated && user ? `Signed in as ${user.email}` : 'Sign in'
            }
            onClick={() => {
              router.push(isAuthenticated ? '/account' : '/login');
            }}
          >
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </MobileIconButton>
        </div>
      </div>
      {isMenuOpen ? (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-border bg-background px-4 pb-4 pt-2 sm:px-6"
        >
          <ul className="space-y-2">
            {menuItems.map(item => {
              const topHref = item.url ? normalizeHref(item.url) : null;
              const topExternal = topHref ? isExternalUrl(topHref) : false;

              return (
                <li
                  key={item.title}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="text-sm font-semibold text-ink">
                    {topHref ? (
                      topExternal || item.openInNewTab ? (
                        <a
                          href={topHref}
                          target={item.openInNewTab ? '_blank' : undefined}
                          rel={
                            item.openInNewTab
                              ? 'noopener noreferrer'
                              : undefined
                          }
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <Link
                          href={topHref}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.title}
                        </Link>
                      )
                    ) : (
                      item.title
                    )}
                  </div>

                  {item.children.length > 0 ? (
                    <ul className="mt-2 space-y-1 border-t border-border pt-2">
                      {item.children.map(child => {
                        const childHref = child.url
                          ? normalizeHref(child.url)
                          : null;
                        const childExternal = childHref
                          ? isExternalUrl(childHref)
                          : false;
                        return (
                          <li key={`${item.title}-${child.title}`}>
                            {!childHref ? (
                              <span className="block py-1 text-sm text-ink-muted">
                                {child.title}
                              </span>
                            ) : childExternal || child.openInNewTab ? (
                              <a
                                href={childHref}
                                target={
                                  child.openInNewTab ? '_blank' : undefined
                                }
                                rel={
                                  child.openInNewTab
                                    ? 'noopener noreferrer'
                                    : undefined
                                }
                                className="block py-1 text-sm text-ink-muted"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {child.title}
                              </a>
                            ) : (
                              <Link
                                href={childHref}
                                className="block py-1 text-sm text-ink-muted"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {child.title}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
