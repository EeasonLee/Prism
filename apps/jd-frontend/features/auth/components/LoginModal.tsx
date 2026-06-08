'use client';

import { cn } from '@prism/shared';
import { Loader } from '@prism/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useId, useRef, useState } from 'react';
import type React from 'react';
import { useAuth } from '../hooks/useAuth';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// LoginModal — terminal / cyberpunk style login dialog
// ---------------------------------------------------------------------------

export function LoginModal({
  open,
  onClose,
}: LoginModalProps): React.JSX.Element | null {
  const router = useRouter();
  const { login, error: authError } = useAuth();
  const formId = useId();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const email = emailRef.current?.value.trim() ?? '';
      const password = passwordRef.current?.value ?? '';

      if (!email || !password) {
        setError('COMMANDER_ID and ACCESS_CODE are required');
        return;
      }

      setLoading(true);
      try {
        const ok = await login(email, password);
        if (ok) {
          onClose();
          router.push('/dashboard' as Parameters<typeof router.push>[0]);
        }
      } finally {
        setLoading(false);
      }
    },
    [login, onClose, router]
  );

  // Keyboard shortcut: Escape to close
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  if (!open) return null;

  const displayError = error ?? authError;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication required"
    >
      {/* Dialog box */}
      <div
        className="relative w-full max-w-sm border border-[#39ff14]/60 bg-[#0a0a0a] p-6 shadow-[0_0_30px_rgba(57,255,20,0.15)]"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: 'var(--font-mono, "JetBrains Mono"), monospace' }}
      >
        {/* ── Title bar ─────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between border-b border-[#39ff14]/30 pb-2">
          <span className="text-xs tracking-[0.15em] text-[#39ff14]">
            SYSTEM_ACCESS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#39ff14]/50 transition-colors hover:text-[#39ff14] focus:outline-none"
            aria-label="Close"
          >
            [X]
          </button>
        </div>

        {/* ── Error ─────────────────────────────────── */}
        {displayError && (
          <div className="mb-4 border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
            {displayError}
          </div>
        )}

        {/* ── Form ──────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor={`${formId}-email`}
              className="mb-1 block text-xs uppercase tracking-[0.12em] text-[#39ff14]/70"
            >
              COMMANDER_ID
            </label>
            <input
              ref={emailRef}
              id={`${formId}-email`}
              type="email"
              autoComplete="email"
              placeholder="your.email@domain.com"
              className={cn(
                'w-full border border-[#39ff14]/40 bg-black px-3 py-2 text-sm text-[#39ff14] placeholder:text-[#39ff14]/25',
                'focus:border-[#39ff14]/80 focus:outline-none focus:shadow-[0_0_8px_rgba(57,255,20,0.2)]',
                'transition-all duration-150'
              )}
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono"), monospace',
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor={`${formId}-password`}
              className="mb-1 block text-xs uppercase tracking-[0.12em] text-[#39ff14]/70"
            >
              ACCESS_CODE
            </label>
            <input
              ref={passwordRef}
              id={`${formId}-password`}
              type="password"
              autoComplete="current-password"
              placeholder="············"
              className={cn(
                'w-full border border-[#39ff14]/40 bg-black px-3 py-2 text-sm text-[#39ff14] placeholder:text-[#39ff14]/25',
                'focus:border-[#39ff14]/80 focus:outline-none focus:shadow-[0_0_8px_rgba(57,255,20,0.2)]',
                'transition-all duration-150'
              )}
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono"), monospace',
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full border border-[#39ff14]/60 bg-[#39ff14]/10 px-4 py-2.5 text-sm uppercase tracking-[0.2em] text-[#39ff14]',
              'hover:bg-[#39ff14]/20 hover:shadow-[0_0_12px_rgba(57,255,20,0.25)]',
              'focus:outline-none focus:ring-1 focus:ring-[#39ff14]/50',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'transition-all duration-150'
            )}
            style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono"), monospace',
            }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader size="sm" className="text-[#39ff14]" />
                AUTHENTICATING...
              </span>
            ) : (
              'AUTHENTICATE'
            )}
          </button>
        </form>

        {/* ── Footer — blinking cursor prompt ──────── */}
        <div className="mt-4 border-t border-[#39ff14]/20 pt-3 text-[10px] text-[#39ff14]/40">
          <span className="inline-block h-3 w-2 animate-pulse bg-[#39ff14]/60 align-middle" />
          <span className="ml-2 align-middle">
            INSERT_ACCESS_CODE &gt; AUTHENTICATE
          </span>
        </div>
      </div>
    </div>
  );
}
