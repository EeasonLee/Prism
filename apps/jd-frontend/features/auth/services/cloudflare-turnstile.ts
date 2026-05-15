/**
 * Cloudflare Turnstile verification utilities
 */

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    // If no secret key is configured, skip verification in development
    if (process.env.NODE_ENV === 'development') {
      return { success: true };
    }
    return { success: false, error: 'Turnstile secret key not configured' };
  }

  try {
    const params: Record<string, string> = {
      secret: secretKey,
      response: token,
    };

    if (remoteIp) {
      params.remoteip = remoteIp;
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params),
      }
    );

    const data = (await response.json()) as TurnstileVerifyResponse;

    // Debug: log full Turnstile response
    console.log('[Turnstile verify] response:', JSON.stringify(data));
    console.log('[Turnstile verify] remoteIp:', remoteIp);

    if (data.success) {
      return { success: true };
    }

    const errorCodes = data['error-codes'] ?? ['unknown-error'];

    // 将技术错误码转换为用户友好的消息
    const userFriendlyError = errorCodes.some(
      code =>
        code === 'timeout-or-duplicate' || code === 'invalid-input-response'
    )
      ? 'Verification expired, please complete the security check again'
      : `Turnstile verification failed: ${errorCodes.join(', ')}`;

    return {
      success: false,
      error: userFriendlyError,
    };
  } catch {
    return { success: false, error: 'Turnstile verification request failed' };
  }
}
