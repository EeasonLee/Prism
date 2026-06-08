'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PageContainer } from '@prism/ui';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { LoginModal } from '../../features/auth/components/LoginModal';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading, user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  // Auto-open login modal if redirected from /dashboard
  useEffect(() => {
    if (
      !isLoading &&
      !isLoggedIn &&
      searchParams.get('redirect') === '/dashboard'
    ) {
      setLoginOpen(true);
    }
  }, [isLoading, isLoggedIn, searchParams]);

  const handleDashboardClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLoading) {
        e.preventDefault();
        return;
      }
      if (!isLoggedIn) {
        e.preventDefault();
        setLoginOpen(true);
      }
      // If logged in, let the Link navigate normally to /dashboard (nginx proxied Hermes Dashboard)
    },
    [isLoading, isLoggedIn]
  );

  const handleLoginClose = useCallback(() => {
    setLoginOpen(false);
    // Clean up redirect param from URL
    if (searchParams.get('redirect') === '/dashboard') {
      router.replace(pathname as Parameters<typeof router.replace>[0]);
    }
  }, [router, pathname, searchParams]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.refresh();
  }, [logout, router]);

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
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>

          <Link
            href="/dashboard"
            onClick={handleDashboardClick}
            className={
              isLoading
                ? 'pointer-events-none text-sm font-medium text-muted-foreground/40'
                : 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            Dashboard
          </Link>

          <div className="ml-2 border-l border-border pl-4">
            {isLoading ? (
              <span className="text-xs text-muted-foreground/50">...</span>
            ) : isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Login
              </button>
            )}
          </div>
        </nav>
      </PageContainer>

      <LoginModal open={loginOpen} onClose={handleLoginClose} />
    </header>
  );
}
