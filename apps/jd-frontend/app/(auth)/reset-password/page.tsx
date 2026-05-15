'use client';

import { Suspense, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="h-6 w-3/4 animate-pulse rounded bg-surface" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-surface" />
      <div className="mt-5 space-y-4">
        <div className="h-10 animate-pulse rounded bg-surface" />
        <div className="h-10 animate-pulse rounded bg-surface" />
        <div className="h-10 animate-pulse rounded bg-surface" />
        <div className="h-12 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const id = searchParams.get('id') ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePassword = useCallback((value: string): string | null => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    const categories = [hasUpper, hasLower, hasDigit, hasSpecial].filter(
      Boolean
    ).length;
    if (categories < 3) {
      return 'Password must contain at least 3 of: uppercase, lowercase, number, special character';
    }
    return null;
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!email.trim()) {
        setError('Email is required');
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            resetToken: token,
            newPassword: password,
          }),
        });

        const data = (await res.json()) as {
          success?: boolean;
          error?: { message?: string };
        };

        if (!res.ok || data.error) {
          throw new Error(data.error?.message ?? 'Failed to reset password');
        }

        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [email, token, password, confirmPassword, validatePassword]
  );

  if (!token || !id) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-ink">Invalid Link</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="btn-primary mt-6 block w-full py-3 text-center text-sm font-semibold"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold text-ink">Reset Password</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Enter your email and new password below.
      </p>

      {success ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
            Your password has been reset successfully. Please sign in with your
            new password.
          </div>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="btn-primary w-full py-3 text-sm font-semibold"
          >
            Sign in
          </button>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-ink">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink">New Password</span>
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              placeholder="••••••••"
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              At least 8 characters with 3 of: uppercase, lowercase, number,
              special character.
            </p>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink">Confirm Password</span>
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div className="space-y-2">
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border-l-4 border-red-400"
              >
                {error}
              </p>
              {error.toLowerCase().includes('token') && (
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Request a new reset link
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>

          <p className="text-center text-sm text-ink-muted">
            <Link
              href="/login"
              className="font-medium text-brand hover:underline"
            >
              Back to Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
