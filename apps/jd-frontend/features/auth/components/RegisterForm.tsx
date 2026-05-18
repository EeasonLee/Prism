'use client';

import { useCallback, useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Check } from 'lucide-react';

interface RegisterFormProps {
  onSubmit: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    turnstileToken?: string
  ) => Promise<void>;
  onSwitchToSignIn?: () => void;
  submitLabel?: string;
  loadingLabel?: string;
}

export function RegisterForm({
  onSubmit,
  onSwitchToSignIn,
  submitLabel = 'Create account',
  loadingLabel = 'Creating account…',
}: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // 密码强度校验（与 SignUpStep 统一）
  const allRulesMet =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-ink';

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
      try {
        await onSubmit(
          email,
          password,
          firstName || undefined,
          lastName || undefined,
          turnstileToken ?? undefined
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed');
        setTurnstileToken(null);
        turnstileRef.current?.reset();
      } finally {
        setLoading(false);
      }
    },
    [email, password, firstName, lastName, turnstileToken, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reg-firstname" className={labelClass}>
            First Name
          </label>
          <input
            id="reg-firstname"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Jane"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="reg-lastname" className={labelClass}>
            Last Name
          </label>
          <input
            id="reg-lastname"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Doe"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="reg-email" className={labelClass}>
          Email
        </label>
        <input
          id="reg-email"
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
        <label htmlFor="reg-password" className={labelClass}>
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
        />
        {/* Password rule feedback */}
        {password.length > 0 && (
          <div className="mt-2 space-y-1">
            <p
              className={`flex items-center gap-1.5 text-xs ${
                password.length >= 8 ? 'text-green-600' : 'text-ink-muted'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  password.length >= 8 ? 'opacity-100' : 'opacity-30'
                }`}
              />
              At least 8 characters
            </p>
            <p
              className={`flex items-center gap-1.5 text-xs ${
                /[A-Z]/.test(password) && /[a-z]/.test(password)
                  ? 'text-green-600'
                  : 'text-ink-muted'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  /[A-Z]/.test(password) && /[a-z]/.test(password)
                    ? 'opacity-100'
                    : 'opacity-30'
                }`}
              />
              Upper and lowercase letters
            </p>
            <p
              className={`flex items-center gap-1.5 text-xs ${
                /\d/.test(password) ? 'text-green-600' : 'text-ink-muted'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  /\d/.test(password) ? 'opacity-100' : 'opacity-30'
                }`}
              />
              At least one number
            </p>
          </div>
        )}
      </div>

      {process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && (
        <div className="flex justify-center">
          <Turnstile
            key="register-turnstile"
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
        className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60"
      >
        {loading ? loadingLabel : submitLabel}
      </button>

      {onSwitchToSignIn && (
        <p className="text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-medium text-brand hover:underline"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}
