'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { LoginModal } from '../../app/components/LoginModal';

type LoginTab = 'signin' | 'register';

interface AuthModalContextValue {
  openLogin: (tab?: LoginTab) => void;
  closeLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<LoginTab>('signin');

  const openLogin = useCallback((tab: LoginTab = 'signin') => {
    setDefaultTab(tab);
    setIsOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openLogin, closeLogin }),
    [openLogin, closeLogin]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <LoginModal
        isOpen={isOpen}
        onClose={closeLogin}
        defaultTab={defaultTab}
      />
    </AuthModalContext.Provider>
  );
}
