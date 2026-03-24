'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ShoppingCart, UserRound } from 'lucide-react';
import { useAuth } from '../../lib/auth/context';
import { useAuthModal } from '../../lib/auth-modal/context';
import { useCart } from '../../lib/cart/context';
import { getNavBadgeValue } from './nav-config';

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

export function MobileNavBar() {
  const { itemCount, openCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  return (
    <div className="flex h-[73px] items-center justify-between gap-3 px-4 sm:px-6 md:hidden">
      <Link href="/" aria-label="Go to home page" className="flex shrink-0 items-center">
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
          onClick={() => openLogin('signin')}
        >
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </MobileIconButton>
      </div>
    </div>
  );
}
