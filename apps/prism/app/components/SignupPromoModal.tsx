'use client';

import { X } from 'lucide-react';
import Image from 'next/image';

/** Mock 弹窗内容配置，后续对接接口 */
const MOCK_CONTENT = {
  imageUrl:
    'https://fellowproducts.com/cdn/shop/files/Web-Espresso-HP-50-50_1100x.jpg?v=1772826627',
  headline: 'Join the Joydeem Family',
  subline: 'Get exclusive offers, recipes & kitchen tips.',
  ctaText: 'Create Account',
  dismissText: 'No, thanks',
  legalText:
    'By creating an account, you agree to our Terms of Use and Privacy Policy.',
} as const;

interface SignupPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
}

export function SignupPromoModal({
  isOpen,
  onClose,
  onRegister,
}: SignupPromoModalProps) {
  if (!isOpen) return null;

  const handleRegister = () => {
    onRegister();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign up for exclusive offers"
    >
      <div className="relative flex w-full max-w-[860px] flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl sm:flex-row">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-surface-muted sm:h-auto sm:min-h-[420px] sm:w-1/2">
          <Image
            src={MOCK_CONTENT.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>

        <div className="flex flex-1 flex-col justify-center px-8 py-6 text-center sm:text-left">
          <h2 className="heading-3 mb-1 text-ink">{MOCK_CONTENT.headline}</h2>
          <p className="body-text mb-6 text-ink-muted">
            {MOCK_CONTENT.subline}
          </p>

          <button
            type="button"
            onClick={handleRegister}
            className="btn-primary mb-4 w-full py-3.5 text-sm font-semibold"
          >
            {MOCK_CONTENT.ctaText}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="body-text block w-full text-ink-muted underline underline-offset-2 transition hover:text-ink"
          >
            {MOCK_CONTENT.dismissText}
          </button>

          <p className="micro-text mt-6 text-center text-ink-faint sm:text-left">
            {MOCK_CONTENT.legalText}
          </p>
        </div>
      </div>
    </div>
  );
}
