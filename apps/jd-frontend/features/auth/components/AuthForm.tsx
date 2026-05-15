'use client';

import { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './auth.context';
import { SignInForm } from './SignInForm';
import { RegisterForm } from './RegisterForm';

interface AuthFormProps {
  /** 初始 tab */
  defaultTab?: 'signin' | 'register';
  /** 登录/注册成功后的回调 */
  onSuccess?: () => void;
  /** 登录成功后的跳转路径（默认从 ?next= 读取） */
  nextPath?: string;
}

export function AuthForm({
  defaultTab = 'signin',
  onSuccess,
  nextPath: nextPathProp,
}: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, isAuthenticated, isLoading } = useAuth();

  const nextPath = nextPathProp ?? searchParams.get('next') ?? '/account';

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
      onSuccess?.();
    },
    [login, onSuccess]
  );

  const handleRegister = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string,
      turnstileToken?: string
    ) => {
      await register(email, password, firstName, lastName, turnstileToken);
      onSuccess?.();
    },
    [register, onSuccess]
  );

  return (
    <div className="space-y-4">
      {defaultTab === 'signin' && (
        <SignInForm
          onSubmit={handleLogin}
          forgotPasswordHref="/forgot-password"
        />
      )}

      {defaultTab === 'register' && <RegisterForm onSubmit={handleRegister} />}
    </div>
  );
}
