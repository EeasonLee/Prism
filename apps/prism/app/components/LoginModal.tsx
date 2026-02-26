'use client';

import { X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useAuth } from '../../lib/auth/context';

type Tab = 'signin' | 'register';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 登录/注册成功后的回调 */
  onSuccess?: () => void;
  /** 初始显示的 tab */
  defaultTab?: Tab;
}

export function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'signin',
}: LoginModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>(defaultTab);

  // Sign In 表单状态
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register 表单状态
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError(null);
      setLoginLoading(true);
      try {
        await login(loginEmail, loginPassword);
        onSuccess?.();
        onClose();
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : 'Sign in failed');
      } finally {
        setLoginLoading(false);
      }
    },
    [loginEmail, loginPassword, login, onSuccess, onClose]
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setRegError(null);
      setRegLoading(true);
      try {
        await register(
          regEmail,
          regPassword,
          regFirstName || undefined,
          regLastName || undefined
        );
        onSuccess?.();
        onClose();
      } catch (err) {
        setRegError(err instanceof Error ? err.message : 'Registration failed');
      } finally {
        setRegLoading(false);
      }
    },
    [
      regEmail,
      regPassword,
      regFirstName,
      regLastName,
      register,
      onSuccess,
      onClose,
    ]
  );

  if (!isOpen) return null;

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-ink';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'signin' ? 'Sign in' : 'Create account'}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl bg-surface p-1">
          <button
            type="button"
            onClick={() => setTab('signin')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === 'signin'
                ? 'bg-background text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === 'register'
                ? 'bg-background text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Sign In */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="login-email" className={labelClass}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-password" className={labelClass}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {loginError && (
              <p role="alert" className="text-sm text-red-500">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-ink-muted">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setTab('register')}
                className="font-medium text-brand hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        )}

        {/* Create Account */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-firstname" className={labelClass}>
                  First Name
                </label>
                <input
                  id="reg-firstname"
                  type="text"
                  autoComplete="given-name"
                  value={regFirstName}
                  onChange={e => setRegFirstName(e.target.value)}
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
                  value={regLastName}
                  onChange={e => setRegLastName(e.target.value)}
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
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
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
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-ink-muted">
                At least 8 characters with uppercase, lowercase, a number, and a
                special character.
              </p>
            </div>

            {regError && (
              <p role="alert" className="text-sm text-red-500">
                {regError}
              </p>
            )}

            <button
              type="submit"
              disabled={regLoading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60"
            >
              {regLoading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-center text-sm text-ink-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setTab('signin')}
                className="font-medium text-brand hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
