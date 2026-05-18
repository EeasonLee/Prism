'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { checkEmail } from '../services/check-email';

interface EmailStepProps {
  onResult: (email: string, exists: boolean) => void;
}

export function EmailStep({ onResult }: EmailStepProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidEmail = useCallback((value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!isValidEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }

      setLoading(true);

      try {
        const result = await checkEmail(email);
        onResult(result.email, result.exists);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check email');
      } finally {
        setLoading(false);
      }
    },
    [email, onResult]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Sign in or create account
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Enter your email to get started.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm text-ink placeholder:text-ink-muted transition-all focus:border-brand focus:bg-background focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>

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
          className="btn-primary w-full py-3 text-sm font-semibold transition-all hover:shadow-md disabled:opacity-60 disabled:hover:shadow-none"
        >
          {loading ? 'Checking…' : 'Continue'}
        </button>
      </form>

      <p className="text-center text-xs text-ink-muted">
        Continue shopping?{' '}
        <Link href="/" className="font-medium text-brand hover:underline">
          Go to home
        </Link>
      </p>
    </div>
  );
}
