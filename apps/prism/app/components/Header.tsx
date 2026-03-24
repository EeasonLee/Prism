'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useAuth } from '../../lib/auth/context';
import { useAuthModal } from '../../lib/auth-modal/context';
import { useCart } from '../../lib/cart/context';
import { CartDrawer } from './CartDrawer';
import { MobileNavBar } from './MobileNavBar';

type NavLink = {
  label: string;
  href: string; // Will be '/aboutus' | '/support' | '/recipes' at runtime
};

type DropdownItem = {
  label: string;
  href: string; // Can be external URL or internal route
};

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

type DropdownNavProps = {
  label: string;
  items: DropdownItem[];
};

function DropdownNav({ label, items }: DropdownNavProps) {
  const linkClassName =
    'block px-4 py-3 text-sm font-medium text-ink leading-none transition hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex h-full items-center gap-2 px-2 py-1 text-base font-medium text-ink leading-none transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-expanded="false"
      >
        {label}
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div className="pointer-events-none invisible absolute left-0 top-full z-20 w-60 translate-y-2 overflow-hidden rounded-xl border border-border bg-background opacity-0 shadow-xl transition duration-200 ease-out group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 focus-within:pointer-events-auto focus-within:visible focus-within:translate-y-0 focus-within:opacity-100">
        <ul className="divide-y divide-border p-2">
          {items.map(item => {
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
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

export function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { openLogin } = useAuthModal();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { itemCount, openCart, isCartOpen } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks: NavLink[] = [
    { label: 'About Us', href: 'https://www.joydeem.com/aboutus' },
  ];

  const supportLinks: DropdownItem[] = [
    { label: 'FAQs', href: 'https://www.joydeem.com/faqs' },
    { label: 'Warranty', href: 'https://www.joydeem.com/warrant' },
    { label: 'Return Policy', href: 'https://www.joydeem.com/return-policy' },
    { label: 'Contact Us', href: 'https://www.joydeem.com/contact-us' },
  ];

  const productLinks: DropdownItem[] = [
    {
      label: 'Dough Mixers',
      href: 'https://www.joydeem.com/kitchen-appliances/dough-makers.html',
    },
    {
      label: 'Rice Cookers',
      href: 'https://www.joydeem.com/kitchen-appliances/rice-cookers.html',
    },
    {
      label: 'Blenders & Juicers',
      href: 'https://www.joydeem.com/kitchen-appliances/kitchen-appliances-blenders-juicers-html.html',
    },
    {
      label: 'Hot Pots With Grill',
      href: 'https://www.joydeem.com/kitchen-appliances/asian-specialty.html',
    },
    {
      label: 'Kettles & Tea Machines',
      href: 'https://www.joydeem.com/kitchen-appliances/kitchen-gadgets.html',
    },
    {
      label: 'Meat Grinders',
      href: 'https://www.joydeem.com/kitchen-appliances/meat-grinders.html',
    },
    {
      label: 'Steam Ovens',
      href: 'https://www.joydeem.com/kitchen-appliances/steam-ovens.html',
    },
  ];

  return (
    <>
      <CartDrawer />
      <header className="sticky top-0 z-30 bg-surface-muted">
        <div className="relative mx-auto flex h-[73px] w-full max-w-[1720px] items-center justify-between px-4 sm:px-6 lg:px-[50px]">
          <a
            // href="https://www.joydeem.com/"
            href="/"
            className="hidden shrink-0 items-center md:flex"
          >
            <Image
              src="/images/logo.png"
              alt="Joydeem"
              width={170}
              height={57}
              className="h-[57px] w-auto"
              priority
            />
          </a>

          <nav
            aria-label="主导航"
            className="hidden h-[55px] flex-1 items-center justify-center gap-9 md:flex"
          >
            <DropdownNav label="Products" items={productLinks} />

            {navLinks.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex h-full items-center px-2 py-1 text-base font-medium text-ink leading-none transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ))}

            <DropdownNav label="Support" items={supportLinks} />

            <Link
              href="/shop"
              className="inline-flex h-full items-center px-2 py-1 text-base font-medium text-ink leading-none transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Shop
            </Link>

            <Link
              href="/recipes"
              className="inline-flex h-full items-center px-2 py-1 text-base font-medium text-ink leading-none transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Recipes
            </Link>

            <Link
              href="/blog"
              className="inline-flex h-full items-center px-2 py-1 text-base font-medium text-ink leading-none transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Blog
            </Link>
          </nav>

          <div className="hidden shrink-0 items-center justify-end gap-1 sm:gap-2 md:flex">
            {/* <IconButton label="Search">
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
          </IconButton> */}

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
                    {/* 点击遮罩关闭 */}
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
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
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

            {/* <IconButton label="Favorites" badge={0}>
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
              <path d="M12 17.5 6.5 21l1.5-6-5-4.5 6.6-.5L12 4l2.4 6 6.6.5-5 4.5 1.5 6z" />
            </svg>
          </IconButton> */}

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
          <MobileNavBar />
        </div>
      </header>
    </>
  );
}
