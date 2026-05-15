'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { User, ChevronLeft, Check } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface SignUpStepProps {
  email: string;
  onSubmit: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    turnstileToken?: string
  ) => Promise<void>;
  onBack: () => void;
}

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <p
      className={`flex items-center gap-1.5 text-xs ${
        met ? 'text-green-600' : 'text-ink-muted'
      }`}
    >
      <Check className={`h-3.5 w-3.5 ${met ? 'opacity-100' : 'opacity-30'}`} />
      {text}
    </p>
  );
}

export function SignUpStep({ email, onSubmit, onBack }: SignUpStepProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const allRulesMet =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      // 从邮箱提取默认姓名：firstName = @ 前面部分，lastName = "-"
      const emailParts = email.split('@');
      const defaultFirstName = emailParts[0] || '-';
      const defaultLastName = '-';

      try {
        await onSubmit(
          email,
          password,
          defaultFirstName,
          defaultLastName,
          turnstileToken ?? undefined
        );
        // 注册成功，保持 loading 状态直到页面跳转
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed');
        setTurnstileToken(null);
        turnstileRef.current?.reset();
        setLoading(false);
      }
    },
    [email, password, turnstileToken, onSubmit]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Create your account
        </h2>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Hidden username for password managers */}

        <div>
          <label
            htmlFor="signup-email"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Email
          </label>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
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
          </p>
        </div>
        <div>
          <label
            htmlFor="signup-password"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Create password
          </label>

          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              autoFocus
              minLength={8}
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

          {/* Password rule feedback — 始终显示 */}
          <div className="mt-2 space-y-1">
            <PasswordRule
              met={password.length >= 8}
              text="At least 8 characters"
            />
            <PasswordRule
              met={/[A-Z]/.test(password) && /[a-z]/.test(password)}
              text="Upper and lowercase letters"
            />
            <PasswordRule
              met={/\d/.test(password)}
              text="At least one number"
            />
          </div>
        </div>

        {process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && (
          <div className="flex justify-center">
            <Turnstile
              key="signup-turnstile"
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
              onSuccess={setTurnstileToken}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpire}
            />
          </div>
        )}

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
          disabled={
            loading ||
            !allRulesMet ||
            (process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
              ? !turnstileToken
              : false)
          }
          className="btn-primary w-full py-3 text-sm font-semibold transition-all hover:shadow-md disabled:opacity-60 disabled:hover:shadow-none"
        >
          {loading ? 'Creating account…' : 'Create account'}
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

      <p className="text-center text-xs leading-relaxed text-ink-muted">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="font-medium text-ink hover:underline">
          Terms of Use
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="font-medium text-ink hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
