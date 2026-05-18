'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';

interface SignInFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitchToRegister?: () => void;
  submitLabel?: string;
  loadingLabel?: string;
  forgotPasswordHref?: string;
}

export function SignInForm({
  onSubmit,
  onSwitchToRegister,
  submitLabel = 'Sign in',
  loadingLabel = 'Signing in…',
  forgotPasswordHref = '/forgot-password',
}: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-ink';

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await onSubmit(email, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign in failed');
      } finally {
        setLoading(false);
      }
    },
    [email, password, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signin-email" className={labelClass}>
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="signin-password" className={labelClass}>
            Password
          </label>
          <Link
            href={forgotPasswordHref}
            className="text-sm font-medium text-brand hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
        <input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
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
        className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60"
      >
        {loading ? loadingLabel : submitLabel}
      </button>

      {onSwitchToRegister && (
        <p className="text-center text-sm text-ink-muted">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-brand hover:underline"
          >
            Create one
          </button>
        </p>
      )}
    </form>
  );
}
