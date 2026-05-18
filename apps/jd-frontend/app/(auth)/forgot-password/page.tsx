'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = (await res.json()) as {
          success?: boolean;
          error?: { message?: string };
        };

        if (!res.ok || data.error) {
          throw new Error(data.error?.message ?? 'Failed to send reset email');
        }

        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [email]
  );

  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold text-ink">Forgot Password</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {sent ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
            If an account with that email exists, we&apos;ve sent a password
            reset link. Please check your inbox.
          </div>
          <Link
            href="/login"
            className="btn-primary block w-full py-3 text-center text-sm font-semibold"
          >
            Back to Sign in
          </Link>
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

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border-l-4 border-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-medium text-brand hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
