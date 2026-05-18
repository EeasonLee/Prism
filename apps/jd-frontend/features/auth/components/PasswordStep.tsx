'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { User, ChevronLeft } from 'lucide-react';

interface PasswordStepProps {
  email: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  onBack: () => void;
  onForgotPassword?: () => void;
}

export function PasswordStep({
  email,
  onSubmit,
  onBack,
  onForgotPassword,
}: PasswordStepProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await onSubmit(email, password);
        // 登录成功，保持 loading 状态直到页面跳转
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign in failed');
        setLoading(false);
      }
    },
    [email, password, onSubmit]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Enter your password
        </h2>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Hidden username for password managers */}

        <div>
          <label
            htmlFor="signin-email"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Email
          </label>
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-medium text-ink">{email}</span>

            <input
              type="email"
              name="username"
              autoComplete="username"
              value={email}
              readOnly
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="signin-password"
              className="block text-sm font-medium text-ink"
            >
              Password
            </label>
            <Link
              href={`/forgot-password?email=${encodeURIComponent(email)}`}
              onClick={onForgotPassword}
              className="text-sm font-medium text-brand transition-colors hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              autoFocus
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 pr-16 text-sm text-ink placeholder:text-ink-muted transition-all focus:border-brand focus:bg-background focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
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
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center justify-center gap-1.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Use a different email
        </button>
      </form>
    </div>
  );
}
