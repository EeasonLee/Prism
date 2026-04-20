/**
 * 异常告警工具
 * 支持通过 Discord Webhook 发送实时告警
 */

import { env } from './env';

let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 60_000; // 同类异常 1 分钟内只告警一次

function shouldThrottle(_key: string): boolean {
  const now = Date.now();
  if (now - lastAlertTime < ALERT_COOLDOWN_MS) {
    return true;
  }
  lastAlertTime = now;
  return false;
}

/**
 * 通过 Discord Webhook 发送异常告警
 */
export async function sendDiscordAlert(options: {
  title: string;
  message: string;
  error?: unknown;
}): Promise<void> {
  const webhookUrl = env.DISCORD_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[alert] DISCORD_ALERT_WEBHOOK_URL not configured');
    return;
  }

  if (shouldThrottle(options.title)) {
    console.log('[alert] throttled:', options.title);
    return;
  }

  const errorDetail =
    options.error instanceof Error
      ? `${options.error.name}: ${options.error.message}`
      : String(options.error ?? 'N/A');

  const payload = {
    embeds: [
      {
        title: options.title,
        description: options.message,
        color: 0xe74c3c, // 红色
        fields: [
          {
            name: 'Environment',
            value: env.NODE_ENV,
            inline: true,
          },
          {
            name: 'Error',
            value: '```\n' + errorDetail.slice(0, 1000) + '\n```',
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        '[alert] Discord webhook failed:',
        res.status,
        await res.text().catch(() => '')
      );
    }
  } catch (err) {
    console.error('[alert] Failed to send Discord alert:', err);
  }
}
