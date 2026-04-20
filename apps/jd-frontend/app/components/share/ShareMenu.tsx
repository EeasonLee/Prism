'use client';

import {
  Check,
  Copy,
  Facebook,
  Mail,
  MessageSquareShare,
  MessagesSquare,
  Pin,
  Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ShareChannel } from './types';

interface ShareMenuProps {
  copied: boolean;
  onCopyLink: () => void;
  getChannelHref: (channel: ShareChannel) => string;
}

const CORE_CHANNELS: ShareChannel[] = ['sms', 'email', 'whatsapp'];
const SOCIAL_CHANNELS: ShareChannel[] = ['facebook', 'x', 'pinterest'];

const CHANNEL_LABELS: Record<ShareChannel, string> = {
  email: 'Email',
  sms: 'SMS / iMessage',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  x: 'X',
  pinterest: 'Pinterest',
};

const CHANNEL_ICONS: Record<ShareChannel, LucideIcon> = {
  email: Mail,
  sms: MessagesSquare,
  whatsapp: MessageSquareShare,
  facebook: Facebook,
  x: Send,
  pinterest: Pin,
};

export function ShareMenu({
  copied,
  onCopyLink,
  getChannelHref,
}: ShareMenuProps) {
  const CopyIcon = copied ? Check : Copy;

  return (
    <div
      role="menu"
      aria-label="Share options"
      className="absolute right-0 top-full z-20 mt-3 w-[360px] overflow-hidden rounded-[28px] border border-border/80 bg-background/95 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 p-4">
        <button
          type="button"
          role="menuitem"
          aria-label="Copy product link"
          onClick={onCopyLink}
          className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3.5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          <CopyIcon className="h-4 w-4" />
          <span>{copied ? 'Copied' : 'Copy product link'}</span>
        </button>

        <div className="rounded-[24px] border border-border/70 bg-surface/60 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
              Send to someone
            </p>
            <span className="micro-text text-ink-faint">High intent</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {CORE_CHANNELS.map(channel => {
              const Icon = CHANNEL_ICONS[channel];

              return (
                <a
                  key={channel}
                  role="menuitem"
                  href={getChannelHref(channel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-3 text-center text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:bg-surface-muted"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="leading-tight">
                    {CHANNEL_LABELS[channel]}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] border border-border/60 bg-background p-3">
          <div className="mb-3 px-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
              Social media
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SOCIAL_CHANNELS.map(channel => {
              const Icon = CHANNEL_ICONS[channel];

              return (
                <a
                  key={channel}
                  role="menuitem"
                  href={getChannelHref(channel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 px-3 py-3 text-center text-sm font-medium text-ink transition hover:bg-surface"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{CHANNEL_LABELS[channel]}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
