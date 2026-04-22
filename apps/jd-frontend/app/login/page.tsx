'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

type Tab = 'signin' | 'register';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <div className="h-6 w-3/4 animate-pulse rounded bg-surface" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-surface" />
        <div className="mt-5 h-10 animate-pulse rounded bg-surface" />
        <div className="mt-6 space-y-4">
          <div className="h-10 animate-pulse rounded bg-surface" />
          <div className="h-10 animate-pulse rounded bg-surface" />
          <div className="h-12 animate-pulse rounded bg-surface" />
        </div>
      </div>
    </main>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, isAuthenticated, isLoading } = useAuth();

  const defaultTabParam = searchParams.get('tab');
  const nextPath = searchParams.get('next') || '/account';
  const defaultTab: Tab =
    defaultTabParam === 'register' ? 'register' : 'signin';

  const [tab, setTab] = useState<Tab>(defaultTab);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  const title = useMemo(
    () =>
      tab === 'signin' ? 'Sign in to your account' : 'Create your account',
    [tab]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setSubmitting(true);
      try {
        if (tab === 'signin') {
          await login(email, password);
        } else {
          await register(
            email,
            password,
            firstName || undefined,
            lastName || undefined
          );
        }
        router.replace(nextPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setSubmitting(false);
      }
    },
    [
      tab,
      login,
      email,
      password,
      register,
      firstName,
      lastName,
      router,
      nextPath,
    ]
  );

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Access orders, addresses, and profile settings.
        </p>

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-surface p-1">
          <button
            type="button"
            onClick={() => setTab('signin')}
            className={`rounded-lg py-2 text-sm font-medium ${
              tab === 'signin'
                ? 'bg-background text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`rounded-lg py-2 text-sm font-medium ${
              tab === 'register'
                ? 'bg-background text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Register
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-ink">First Name</span>
                <input
                  value={firstName}
                  onChange={event => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-ink">Last Name</span>
                <input
                  value={lastName}
                  onChange={event => setLastName(event.target.value)}
                  autoComplete="family-name"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </label>
            </div>
          )}

          <label className="block text-sm">
            <span className="mb-1 block text-ink">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink">Password</span>
            <input
              required
              type="password"
              minLength={tab === 'register' ? 8 : 1}
              autoComplete={
                tab === 'signin' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              placeholder="********"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60"
          >
            {submitting
              ? tab === 'signin'
                ? 'Signing in...'
                : 'Creating account...'
              : tab === 'signin'
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Continue shopping?{' '}
          <Link href="/" className="font-medium text-brand hover:underline">
            Go to home
          </Link>
        </p>
      </div>
    </main>
  );
}
