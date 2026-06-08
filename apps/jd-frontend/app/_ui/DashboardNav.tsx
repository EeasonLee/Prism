'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { LoginModal } from '../../features/auth/components/LoginModal';

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLoading) {
        e.preventDefault();
        return;
      }
      if (!isLoggedIn) {
        e.preventDefault();
        setLoginOpen(true);
      }
    },
    [isLoading, isLoggedIn]
  );

  const handleLoginClose = useCallback(() => {
    setLoginOpen(false);
    if (searchParams.get('redirect') === '/dashboard') {
      router.replace(pathname as Parameters<typeof router.replace>[0]);
    }
  }, [router, pathname, searchParams]);

  return (
    <>
      <li>
        <Link
          href={'/dashboard' as Route}
          onClick={handleClick}
          className="border-b-2 border-transparent pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4c4546] transition-colors hover:text-black"
        >
          Dashboard
        </Link>
      </li>
      {mounted &&
        createPortal(
          <LoginModal open={loginOpen} onClose={handleLoginClose} />,
          document.body
        )}
    </>
  );
}
