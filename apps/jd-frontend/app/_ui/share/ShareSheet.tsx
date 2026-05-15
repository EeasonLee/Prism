'use client';

import {
  Check,
  Copy,
  Mail,
  MessageSquareShare,
  MessagesSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  FacebookBrandIcon,
  InstagramBrandIcon,
  PinterestBrandIcon,
  XBrandIcon,
} from './social-brand-icons';
import type { ShareChannel } from './types';

interface ShareSheetProps {
  copied: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  getChannelHref: (channel: ShareChannel) => string;
  /** 复制链接后打开指定渠道（用于 Instagram 等无分享 URL 的平台） */
  onCopyAndOpen?: (channel: ShareChannel) => void;
}

const CORE_CHANNELS: ShareChannel[] = ['sms', 'email', 'whatsapp'];
const SOCIAL_CHANNELS: ShareChannel[] = [
  'facebook',
  'x',
  'pinterest',
  'instagram',
];

const CHANNEL_LABELS: Record<ShareChannel, string> = {
  email: 'Email',
  sms: 'SMS / iMessage',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  x: 'X',
  pinterest: 'Pinterest',
  instagram: 'Instagram',
};

const CORE_CHANNEL_ICONS: Record<'email' | 'sms' | 'whatsapp', LucideIcon> = {
  email: Mail,
  sms: MessagesSquare,
  whatsapp: MessageSquareShare,
};

export function ShareSheet({
  copied,
  onClose,
  onCopyLink,
  getChannelHref,
  onCopyAndOpen,
}: ShareSheetProps) {
  const CopyIcon = copied ? Check : Copy;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end bg-black/40 sm:hidden"
      aria-label="Share sheet"
    >
      <button
        type="button"
        aria-label="Close share sheet"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full rounded-t-[32px] bg-background/98 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <div className="flex flex-col gap-4">
          <button
            type="button"
            aria-label="Copy product link"
            onClick={onCopyLink}
            className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3.5 text-center text-sm font-semibold text-background transition hover:opacity-90"
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
                const Icon =
                  CORE_CHANNEL_ICONS[channel as 'email' | 'sms' | 'whatsapp'];
                if (!Icon) return null;

                return (
                  <a
                    key={channel}
                    href={getChannelHref(channel)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-3 text-center text-sm font-medium text-ink transition hover:bg-surface-muted"
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

          <div>
            <div className="mb-3 px-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
                Social media
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SOCIAL_CHANNELS.map(channel => {
                const isInstagram = channel === 'instagram';

                return (
                  <a
                    key={channel}
                    href={getChannelHref(channel)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={
                      isInstagram && onCopyAndOpen
                        ? e => {
                            e.preventDefault();
                            onCopyAndOpen(channel);
                          }
                        : undefined
                    }
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-center text-xs font-medium text-ink transition hover:bg-surface"
                  >
                    {channel === 'facebook' && (
                      <FacebookBrandIcon className="h-9 w-9" />
                    )}
                    {channel === 'x' && <XBrandIcon className="h-9 w-9" />}
                    {channel === 'pinterest' && (
                      <PinterestBrandIcon className="h-9 w-9" />
                    )}
                    {channel === 'instagram' && (
                      <InstagramBrandIcon className="h-9 w-9" />
                    )}
                    <span>{CHANNEL_LABELS[channel]}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
