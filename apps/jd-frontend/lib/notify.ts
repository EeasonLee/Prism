import { env } from './env';
import { sendDiscordAlert } from './alert';

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
