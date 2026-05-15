/**
 * 前端调用 /api/auth/check-email 检查邮箱是否已注册
 */

export interface CheckEmailResult {
  email: string;
  exists: boolean;
  fallback?: boolean;
}

export interface CheckEmailError {
  error: {
    message: string;
    code: string;
  };
}

export async function checkEmail(email: string): Promise<CheckEmailResult> {
  const res = await fetch('/api/auth/check-email', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
    }),
  });

  const data = (await res.json()) as CheckEmailResult | CheckEmailError;

  if (!res.ok) {
    const errorData = data as CheckEmailError;
    throw new Error(errorData.error?.message ?? 'Failed to check email');
  }

  return data as CheckEmailResult;
}
