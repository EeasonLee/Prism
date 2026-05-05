'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { HeaderMenuNode } from '@/features/navigation/types';
import { isRouteActive } from '@/features/navigation/is-route-active';
import { GlobalSearch } from '@/features/search/GlobalSearch';

function MobileIconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-ink-muted transition hover:border-brand/30 hover:bg-brand/10 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        className ?? ''
      }`}
    >
      {children}
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
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [menuTop, setMenuTop] = useState(0);
  const headerBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const updateMenuTop = () => {
      const rect = headerBarRef.current?.getBoundingClientRect();
      setMenuTop(rect?.bottom ?? 0);
    };

    updateMenuTop();
    window.addEventListener('resize', updateMenuTop);
    window.addEventListener('orientationchange', updateMenuTop);

    return () => {
      window.removeEventListener('resize', updateMenuTop);
      window.removeEventListener('orientationchange', updateMenuTop);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <>
      <div
        ref={headerBarRef}
        className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-2 sm:px-6 md:hidden"
      >
        <div className="flex min-w-0 items-center gap-1">
          <MobileIconButton
            label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen(open => !open)}
            className="h-9 w-9 rounded-md border-none bg-transparent hover:bg-surface"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </MobileIconButton>

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
              className="h-10 w-auto sm:h-11"
              priority
            />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <MobileIconButton
            label="Search"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </MobileIconButton>
        </div>
      </div>
      <>
        <button
          type="button"
          aria-label="Close menu"
          className={`fixed inset-x-0 z-40 bg-black/30 transition-opacity duration-200 md:hidden ${
            isMenuOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
          style={{
            top: `${menuTop}px`,
            bottom: 'calc(56px + env(safe-area-inset-bottom))',
          }}
          onClick={() => setIsMenuOpen(false)}
        />
        <nav
          aria-label="Mobile navigation"
          className={`fixed left-0 z-50 w-[88vw] max-w-[360px] overflow-hidden border-r border-border bg-background shadow-xl transition-transform duration-300 ease-out md:hidden ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            top: `${menuTop}px`,
            bottom: 'calc(56px + env(safe-area-inset-bottom))',
          }}
        >
          <ul className="h-full overflow-y-auto px-4 py-2 sm:px-5">
            {menuItems.map(item => {
              const topHref = item.url ? normalizeHref(item.url) : null;
              const hasChildren = item.children.length > 0;
              const isExpanded = expandedSections[item.title] ?? false;
              const firstChildWithUrl = item.children.find(child => child.url);
              const fallbackTopHref =
                firstChildWithUrl?.url != null
                  ? normalizeHref(firstChildWithUrl.url)
                  : null;
              const navigableTopHref = topHref ?? fallbackTopHref;
              const navigableTopExternal = navigableTopHref
                ? isExternalUrl(navigableTopHref)
                : false;
              const shouldOpenInNewTab =
                topHref != null ? item.openInNewTab : false;

              const topPageActive =
                Boolean(navigableTopHref) &&
                !navigableTopExternal &&
                !shouldOpenInNewTab &&
                isRouteActive(pathname, navigableTopHref);

              const topLinkClass = 'block truncate font-semibold text-black';

              return (
                <li key={item.title} className="border-b border-border/70 py-1">
                  <div className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0 flex-1 truncate text-base">
                      {navigableTopHref ? (
                        navigableTopExternal || shouldOpenInNewTab ? (
                          <a
                            href={navigableTopHref}
                            target={shouldOpenInNewTab ? '_blank' : undefined}
                            rel={
                              shouldOpenInNewTab
                                ? 'noopener noreferrer'
                                : undefined
                            }
                            onClick={() => setIsMenuOpen(false)}
                            className={topLinkClass}
                          >
                            {item.title}
                          </a>
                        ) : (
                          <Link
                            href={navigableTopHref}
                            onClick={() => setIsMenuOpen(false)}
                            className={topLinkClass}
                            aria-current={topPageActive ? 'page' : undefined}
                          >
                            {item.title}
                          </Link>
                        )
                      ) : (
                        <span className="font-semibold text-black">
                          {item.title}
                        </span>
                      )}
                    </div>

                    {hasChildren ? (
                      <button
                        type="button"
                        aria-label={`Toggle ${item.title}`}
                        aria-expanded={isExpanded}
                        onClick={() => toggleSection(item.title)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition hover:bg-surface"
                      >
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    ) : null}
                  </div>

                  {hasChildren && isExpanded ? (
                    <ul className="mb-2 space-y-1 rounded-lg bg-surface-muted p-3">
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
                              <span className="block rounded-md px-2 py-2 text-sm text-black">
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
                                className="block rounded-md px-2 py-2 text-sm text-black transition hover:bg-background"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {child.title}
                              </a>
                            ) : (
                              <Link
                                href={childHref}
                                className="block rounded-md px-2 py-2 text-sm text-black transition hover:bg-background"
                                aria-current={
                                  isRouteActive(pathname, childHref)
                                    ? 'page'
                                    : undefined
                                }
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
      </>
      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
