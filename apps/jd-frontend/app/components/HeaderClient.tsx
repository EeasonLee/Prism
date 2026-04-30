'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { HeaderMenuNode } from '@/lib/api/bff/navigation/types';
import { isRouteActive } from '@/lib/navigation/is-route-active';
import { useAuth } from '../../lib/auth/context';
import { useAuthModal } from '../../lib/auth-modal/context';
import { useCart } from '../../lib/cart/context';
import { CartDrawer } from './CartDrawer';
import { GlobalSearch } from './GlobalSearch';
import { MobileNavBar } from './MobileNavBar';

/** 主导航项下划线：绝对定位在文字下方，不占布局高度，避免与旁侧箭头纵向错位 */
const NAV_UNDERLINE_CLASS =
  'relative inline-flex items-center after:pointer-events-none after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 group-hover:after:scale-x-100 focus-visible:after:scale-x-100';

interface HeaderClientProps {
  menuItems: HeaderMenuNode[];
}

interface DropdownItem {
  label: string;
  href: string | null;
  openInNewTab: boolean;
  external: boolean;
}

type IconButtonProps = {
  label: string;
  badge?: number;
  children: ReactNode;
  onClick?: () => void;
  ariaExpanded?: boolean;
  ariaControls?: string;
};

function IconButton({
  label,
  badge,
  children,
  onClick,
  ariaExpanded,
  ariaControls,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink-muted transition hover:border-brand/30 hover:bg-brand/10 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
      {typeof badge === 'number' && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-brand-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('//');
}

function normalizeHref(url: string): string {
  if (isExternalUrl(url)) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

function mapChildrenToDropdownItems(
  children: HeaderMenuNode[]
): DropdownItem[] {
  return children.map(child => {
    const href = child.url ? normalizeHref(child.url) : null;
    return {
      label: child.title,
      href,
      openInNewTab: child.openInNewTab,
      external: href ? isExternalUrl(href) : false,
    };
  });
}

type DropdownNavProps = {
  label: string;
  items: DropdownItem[];
  href?: string | null;
  openInNewTab?: boolean;
  external?: boolean;
};

function DropdownNav({
  label,
  items,
  href = null,
  openInNewTab = false,
  external = false,
}: DropdownNavProps) {
  const pathname = usePathname();

  const triggerClassName =
    'flex h-full items-center px-2 text-base font-medium leading-none text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

  const linkBaseClass =
    'block rounded-md px-3 py-2.5 text-sm font-normal leading-snug text-black transition-colors duration-200 hover:bg-surface-muted/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

  const triggerPageActive =
    href != null && !external && !openInNewTab && isRouteActive(pathname, href);

  const triggerContent = (
    <span className="inline-flex items-center gap-2">
      <span className={NAV_UNDERLINE_CLASS}>{label}</span>
      <svg
        aria-hidden="true"
        className="h-4 w-4 shrink-0 opacity-70"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );

  return (
    <div className="group relative flex h-full items-center">
      {!href ? (
        <button
          type="button"
          className={triggerClassName}
          aria-expanded="false"
        >
          {triggerContent}
        </button>
      ) : external || openInNewTab ? (
        <a
          href={href}
          className={triggerClassName}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {triggerContent}
        </a>
      ) : (
        <Link
          href={href}
          className={triggerClassName}
          aria-current={triggerPageActive ? 'page' : undefined}
        >
          {triggerContent}
        </Link>
      )}
      {/* 使用 pt 而非 mt：间隙仍在下拉祖先盒内，鼠标经过不会触发 mouseleave 关掉菜单 */}
      <div className="pointer-events-none invisible absolute left-0 top-full z-20 pt-1.5 opacity-0 transition duration-200 ease-out group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 focus-within:pointer-events-auto focus-within:visible focus-within:opacity-100">
        <div className="w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border/30 bg-background/95 p-1.5 shadow-[0_16px_48px_-12px_rgba(17,24,39,0.18)] backdrop-blur-sm">
          <ul className="flex flex-col gap-0.5 py-0.5">
            {items.map(item => {
              const itemActive = item.href
                ? isRouteActive(pathname, item.href)
                : false;
              return (
                <li key={`${item.label}-${item.href}`}>
                  {!item.href ? (
                    <span className={linkBaseClass}>{item.label}</span>
                  ) : item.external || item.openInNewTab ? (
                    <a
                      href={item.href}
                      className={linkBaseClass}
                      target={item.openInNewTab ? '_blank' : undefined}
                      rel={
                        item.openInNewTab ? 'noopener noreferrer' : undefined
                      }
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={linkBaseClass}
                      aria-current={itemActive ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ name, email }: { name: string; email: string }) {
  const initial = (name.trim()[0] ?? email[0] ?? '?').toUpperCase();
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-brand-foreground select-none"
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

export function HeaderClient({ menuItems }: HeaderClientProps) {
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { openLogin } = useAuthModal();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mainNavRef = useRef<HTMLElement>(null);
  const { itemCount, openCart, isCartOpen } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  // 纯 CSS 下拉用 focus-within 保持展开；Next 软链后焦点常留在 Link 上，需清掉才收起
  useEffect(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && mainNavRef.current?.contains(active)) {
      active.blur();
    }
  }, [pathname]);

  return (
    <>
      <CartDrawer />
      <header className="sticky top-0 z-30 bg-surface-muted">
        <div className="relative mx-auto hidden h-[73px] w-full max-w-[1720px] items-center justify-between px-4 sm:px-6 lg:px-[50px] md:flex">
          <Link href="/" className="hidden shrink-0 items-center md:flex">
            <Image
              src="/images/logo.png"
              alt="Joydeem"
              width={170}
              height={57}
              className="h-[57px] w-auto"
              priority
            />
          </Link>

          <nav
            ref={mainNavRef}
            aria-label="Main navigation"
            className="hidden h-full flex-1 items-center justify-center gap-9 md:flex"
          >
            {menuItems.map(item => {
              if (item.children.length > 0) {
                const dropdownItems = mapChildrenToDropdownItems(item.children);
                if (dropdownItems.length === 0) return null;
                const topHref = item.url ? normalizeHref(item.url) : null;
                return (
                  <DropdownNav
                    key={item.title}
                    label={item.title}
                    items={dropdownItems}
                    href={topHref}
                    openInNewTab={item.openInNewTab}
                    external={topHref ? isExternalUrl(topHref) : false}
                  />
                );
              }

              if (!item.url) {
                return (
                  <span
                    key={item.title}
                    className="inline-flex h-full items-center px-2 py-1 text-base font-medium leading-none text-black"
                  >
                    {item.title}
                  </span>
                );
              }
              const href = normalizeHref(item.url);
              const external = isExternalUrl(href);

              if (external || item.openInNewTab) {
                return (
                  <a
                    key={item.title}
                    href={href}
                    className="inline-flex h-full items-center px-2 text-base font-medium leading-none text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  >
                    <span className={NAV_UNDERLINE_CLASS}>{item.title}</span>
                  </a>
                );
              }

              const topActive = isRouteActive(pathname, href);

              return (
                <Link
                  key={item.title}
                  href={href}
                  className="inline-flex h-full items-center px-2 text-base font-medium leading-none text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  aria-current={topActive ? 'page' : undefined}
                >
                  <span className={NAV_UNDERLINE_CLASS}>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center justify-end gap-1 sm:gap-2 md:flex">
            <IconButton label="Search" onClick={() => setIsSearchOpen(true)}>
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="m15.5 15.5 3.5 3.5" />
              </svg>
            </IconButton>

            {isAuthenticated && user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-expanded={isUserMenuOpen}
                  onClick={() => setIsUserMenuOpen(open => !open)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition hover:border-brand/30 hover:bg-brand/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <UserAvatar
                    name={user.first_name ?? user.username}
                    email={user.email}
                  />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
                      <div className="border-b border-border px-4 py-3">
                        {(user.first_name || user.last_name) && (
                          <p className="truncate text-sm font-semibold text-ink">
                            {[user.first_name, user.last_name]
                              .filter(Boolean)
                              .join(' ')}
                          </p>
                        )}
                        <p className="truncate text-xs text-ink-muted">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface hover:text-brand"
                      >
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface hover:text-brand"
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface hover:text-brand"
                      >
                        My Addresses
                      </Link>
                      <Link
                        href="/account/wishlist"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block border-b border-border px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface hover:text-brand"
                      >
                        My Wishlist
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          void logout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface hover:text-brand"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <IconButton label="Sign in" onClick={() => openLogin('signin')}>
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.5-3 4.5-4.5 8-4.5s6.5 1.5 8 4.5" />
                </svg>
              </IconButton>
            )}

            <IconButton
              label="Cart"
              badge={itemCount > 0 ? itemCount : undefined}
              onClick={openCart}
              ariaExpanded={isCartOpen}
              ariaControls="cart-drawer"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="17" cy="20" r="1.5" />
                <path d="M3 4h2l1.5 12.5h11l1-9H6.2" />
              </svg>
            </IconButton>
          </div>
        </div>

        <div className="md:hidden">
          <MobileNavBar menuItems={menuItems} />
        </div>
      </header>
      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
