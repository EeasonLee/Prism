'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/context';
import { useAuthModal } from '../../lib/auth-modal/context';
import { SignupPromoModal } from './SignupPromoModal';

const STORAGE_KEY = 'signup_promo_dismissed';

/** Mock 触发规则：是否应展示弹窗。后续对接接口替换。 */
function shouldShowPromo(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    return dismissed !== 'true';
  } catch {
    return true;
  }
}

/** Mock 延迟（ms），后续可改为接口配置。 */
const SHOW_DELAY_MS = 0;

export function SignupPromoController() {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* ignore */
    }
  }, []);

  const handleRegister = useCallback(() => {
    openLogin('register');
  }, [openLogin]);

  useEffect(() => {
    if (isAuthenticated) return;
    if (!shouldShowPromo()) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <SignupPromoModal
      isOpen={isOpen}
      onClose={handleClose}
      onRegister={handleRegister}
    />
  );
}
