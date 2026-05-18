'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './auth.context';
import { EmailStep } from './EmailStep';
import { PasswordStep } from './PasswordStep';
import { SignUpStep } from './SignUpStep';
import { checkEmail } from '../services/check-email';

type AuthStep = 'email' | 'password' | 'signup';

interface AuthPanelProps {
  /** 运行模式 */
  mode?: 'modal' | 'page';
  /** 登录/注册成功后的回调（modal 模式用） */
  onSuccess?: () => void;
  /** 登录成功后的跳转路径（默认从 ?next= 读取） */
  nextPath?: string;
}

export function AuthPanel({
  mode = 'modal',
  onSuccess,
  nextPath: nextPathProp,
}: AuthPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, isAuthenticated, isLoading } = useAuth();

  const nextPath = nextPathProp ?? searchParams.get('next') ?? '/account';

  // Step 状态机
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const verifiedRef = useRef(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // URL 同步：mode=page 时同步 ?step= 和 ?email=
  // 如果 URL 指定了 signup + email，先验证邮箱是否已注册
  useEffect(() => {
    if (mode !== 'page') return;
    if (verifiedRef.current) return;

    const urlStep = searchParams.get('step') as AuthStep | null;
    const urlEmail = searchParams.get('email') ?? '';

    // 如果 URL 直接指定了 password 或 signup 步骤，需要先验证邮箱
    if ((urlStep === 'signup' || urlStep === 'password') && urlEmail) {
      verifiedRef.current = true;
      setIsVerifying(true);
      setEmail(urlEmail);

      checkEmail(urlEmail)
        .then(result => {
          if (result.exists) {
            // 已注册，显示密码登录
            setStep('password');
            syncUrl('password', urlEmail);
          } else {
            // 未注册，显示注册表单
            setStep('signup');
            syncUrl('signup', urlEmail);
          }
        })
        .catch(() => {
          // 验证失败，回退到 email 步骤
          setStep('email');
          syncUrl('email', '');
        })
        .finally(() => {
          setIsVerifying(false);
        });
      return;
    }

    // 正常 URL 同步
    verifiedRef.current = true;
    if (urlStep && ['email', 'password', 'signup'].includes(urlStep)) {
      setStep(urlStep);
    }
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [mode, searchParams]);

  const syncUrl = useCallback(
    (newStep: AuthStep, newEmail: string) => {
      if (mode !== 'page') return;

      const params = new URLSearchParams(searchParams.toString());
      params.set('step', newStep);
      if (newEmail) {
        params.set('email', newEmail);
      } else {
        params.delete('email');
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [mode, router, searchParams]
  );

  // 已登录保护 — 延迟关闭 modal 或跳转（给用户看到成功提示的时间）
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (mode === 'page') {
        // 页面模式：直接跳转
        window.location.replace(nextPath);
      } else if (successMessage) {
        // Modal 模式且已显示成功消息：3秒后关闭
        const timer = setTimeout(() => {
          onSuccess?.();
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        // Modal 模式但没有成功消息（直接登录）：立即关闭
        onSuccess?.();
      }
    }
  }, [isAuthenticated, isLoading, mode, nextPath, onSuccess, successMessage]);

  const handleEmailResult = useCallback(
    (checkedEmail: string, exists: boolean) => {
      setEmail(checkedEmail);
      const newStep = exists ? 'password' : 'signup';
      setStep(newStep);
      syncUrl(newStep, checkedEmail);
    },
    [syncUrl]
  );

  const handleBack = useCallback(() => {
    setStep('email');
    syncUrl('email', '');
  }, [syncUrl]);

  const handleLogin = useCallback(
    async (loginEmail: string, password: string) => {
      await login(loginEmail, password);
      setSuccessMessage('Signed in successfully!');
    },
    [login]
  );

  const handleRegister = useCallback(
    async (
      registerEmail: string,
      password: string,
      firstName?: string,
      lastName?: string,
      turnstileToken?: string
    ) => {
      await register(
        registerEmail,
        password,
        firstName,
        lastName,
        turnstileToken
      );
      setSuccessMessage('Account created successfully!');
    },
    [register]
  );

  const stepContent = useMemo(() => {
    if (successMessage) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-center text-sm font-medium text-ink">
            {successMessage}
          </p>
        </div>
      );
    }

    if (isVerifying) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-ink-muted">Verifying email…</p>
        </div>
      );
    }

    switch (step) {
      case 'email':
        return <EmailStep onResult={handleEmailResult} />;
      case 'password':
        return (
          <PasswordStep
            email={email}
            onSubmit={handleLogin}
            onBack={handleBack}
            onForgotPassword={mode === 'modal' ? onSuccess : undefined}
          />
        );
      case 'signup':
        return (
          <SignUpStep
            email={email}
            onSubmit={handleRegister}
            onBack={handleBack}
          />
        );
      default:
        return <EmailStep onResult={handleEmailResult} />;
    }
  }, [
    successMessage,
    step,
    email,
    isVerifying,
    handleEmailResult,
    handleLogin,
    handleBack,
    handleRegister,
  ]);

  return (
    <div
      key={step}
      className="animate-in fade-in slide-in-from-right-2 duration-200"
    >
      {stepContent}
    </div>
  );
}
