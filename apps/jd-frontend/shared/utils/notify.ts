import { env } from '@/infrastructure/config/env';
import { sendDiscordAlert } from '@/shared/utils/alert';

export async function notifyError(options: {
  title: string;
  message: string;
  error?: unknown;
}): Promise<void> {
  const channel = env.NOTIFY_CHANNEL;

  if (channel === 'discord') {
    await sendDiscordAlert(options);
  } else {
    console.warn('[notify] Unsupported channel:', channel);
  }
}
