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
  token: string
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
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const data = (await response.json()) as TurnstileVerifyResponse;

    if (data.success) {
      return { success: true };
    }

    const errorCodes = data['error-codes'] ?? ['unknown-error'];
    return {
      success: false,
      error: `Turnstile verification failed: ${errorCodes.join(', ')}`,
    };
  } catch {
    return { success: false, error: 'Turnstile verification request failed' };
  }
}
