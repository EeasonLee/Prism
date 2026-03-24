import type { LucideIcon } from 'lucide-react';
import { Grid2x2, Home, ShoppingCart, UserRound } from 'lucide-react';

export interface MobileNavItem {
  key: 'home' | 'categories' | 'cart' | 'account';
  label: string;
  href?: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

export function getNavBadgeValue(count: number): number | undefined {
  return count > 0 ? count : undefined;
}

export const MOBILE_TABBAR_ITEMS: MobileNavItem[] = [
  {
    key: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
    match: pathname => pathname === '/',
  },
  {
    key: 'categories',
    label: 'Categories',
    href: '/shop',
    icon: Grid2x2,
    match: pathname => pathname === '/shop' || pathname.startsWith('/shop/'),
  },
  {
    key: 'cart',
    label: 'Cart',
    icon: ShoppingCart,
    match: () => false,
  },
  {
    key: 'account',
    label: 'My',
    icon: UserRound,
    match: pathname => pathname.startsWith('/account'),
  },
];

const MOBILE_TABBAR_HIDDEN_PREFIXES = ['/checkout'];

export function shouldHideMobileTabbar(pathname: string): boolean {
  return MOBILE_TABBAR_HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix));
}
