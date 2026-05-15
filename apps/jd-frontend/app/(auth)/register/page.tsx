'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/features/auth/components/AuthForm';

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="h-6 w-3/4 animate-pulse rounded bg-surface" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-surface" />
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 animate-pulse rounded bg-surface" />
          <div className="h-10 animate-pulse rounded bg-surface" />
        </div>
        <div className="h-10 animate-pulse rounded bg-surface" />
        <div className="h-10 animate-pulse rounded bg-surface" />
        <div className="h-10 animate-pulse rounded bg-surface" />
        <div className="h-12 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}

function RegisterPageContent() {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Join us to access orders, addresses, and profile settings.
      </p>

      <div className="mt-6">
        <AuthForm defaultTab="register" />
      </div>

      <p className="mt-4 text-center text-xs text-ink-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-2 text-center text-xs text-ink-muted">
        Continue shopping?{' '}
        <Link href="/" className="font-medium text-brand hover:underline">
          Go to home
        </Link>
      </p>
    </div>
  );
}
