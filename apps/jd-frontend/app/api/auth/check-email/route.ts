import { NextResponse } from 'next/server';
import { magentoClient } from '@/infrastructure/api/clients/magento';
import { verifyTurnstileToken } from '@/features/auth/services/cloudflare-turnstile';

// ── IP 限流（内存级） ────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 分钟窗口
const RATE_LIMIT_MAX_REQUESTS = 10; // 每窗口最多 10 次

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipRateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip')?.trim() ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
}

// ── 请求体验证 ──────────────────────────────────────

interface CheckEmailPayload {
  email: string;
  turnstile_token?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Magento 检查邮箱是否已注册 ────────────────────────

async function checkEmailAvailable(email: string): Promise<boolean> {
  try {
    // Magento 2 内置 API：POST /V1/customers/isEmailAvailable
    // 请求体：{ "customerEmail": "..." }
    // 返回：true = 可用（未注册），false = 不可用（已注册）
    const result = await magentoClient.post<boolean>(
      'customers/isEmailAvailable',
      {
        body: {
          customerEmail: email,
        },
      }
    );
    return result;
  } catch {
    // 失败时保守返回 false（假设已注册，让用户走登录流程）
    return false;
  }
}

// ── Route Handler ───────────────────────────────────

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // 1. IP 限流检查
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        error: {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
        },
      },
      { status: 429 }
    );
  }

  // 2. 解析请求体
  let body: CheckEmailPayload;
  try {
    body = (await request.json()) as CheckEmailPayload;
  } catch {
    return NextResponse.json(
      {
        error: {
          message: 'Invalid request body',
          code: 'INVALID_BODY',
        },
      },
      { status: 400 }
    );
  }

  const { email, turnstile_token: turnstileToken } = body;

  // 3. 邮箱格式校验
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      {
        error: {
          message: 'Please enter a valid email address.',
          code: 'INVALID_EMAIL',
        },
      },
      { status: 400 }
    );
  }

  // 4. Turnstile 验证（生产环境强制）
  if (process.env.NODE_ENV === 'production') {
    const clientIp =
      request.headers.get('cf-connecting-ip')?.trim() ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      undefined;

    const turnstileResult = await verifyTurnstileToken(
      turnstileToken ?? '',
      clientIp
    );
    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          error: {
            message: turnstileResult.error ?? 'Captcha verification failed',
            code: 'TURNSTILE_FAILED',
          },
        },
        { status: 400 }
      );
    }
  }

  // 5. 查询 Magento 邮箱是否已注册
  try {
    const isAvailable = await checkEmailAvailable(email);

    return NextResponse.json({
      email,
      exists: !isAvailable, // Magento: true = 未注册(可用), false = 已注册(不可用)
    });
  } catch (error) {
    console.error('[check-email] Magento query failed:', error);
    // 保守策略：假设邮箱已注册（让用户走登录流程）
    return NextResponse.json({
      email,
      exists: true,
      fallback: true,
    });
  }
}
