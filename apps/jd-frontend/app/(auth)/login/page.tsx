'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { AuthPanel } from '@/features/auth/components/AuthPanel';
import { useAuth } from '@/features/auth/components/auth.context';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="rounded-2xl border border-black/5 bg-background p-8 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]">
      <div className="h-7 w-3/4 animate-pulse rounded bg-surface" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-surface" />
      <div className="mt-6 space-y-5">
        <div className="h-12 animate-pulse rounded bg-surface" />
        <div className="h-12 animate-pulse rounded bg-surface" />
        <div className="h-12 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}

function LoginPageContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/account';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  return (
    <div className="rounded-2xl border border-black/5 bg-background p-8 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]">
      <AuthPanel mode="page" />
    </div>
  );
}
