'use client';

import { X } from 'lucide-react';
import { AuthPanel } from './AuthPanel';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 登录/注册成功后的回调 */
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
    >
      <div className="relative w-full max-w-md">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute left-1/2 top-full z-10 mt-3 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow transition hover:bg-black/60 sm:-right-6 sm:-top-10 sm:left-auto sm:mt-0 sm:h-8 sm:w-8 sm:translate-x-0 sm:bg-white sm:text-ink-muted sm:hover:bg-surface sm:hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="w-full rounded-2xl border border-black/5 bg-background p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]">
          <AuthPanel mode="modal" onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}
