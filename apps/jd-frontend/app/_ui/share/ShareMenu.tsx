'use client';

import { Check, Copy } from 'lucide-react';
import {
  EmailBrandIcon,
  FacebookBrandIcon,
  InstagramBrandIcon,
  PinterestBrandIcon,
  XBrandIcon,
} from './social-brand-icons';
import type { ShareChannel } from './types';

interface ShareMenuProps {
  copied: boolean;
  onCopyLink: () => void;
  getChannelHref: (channel: ShareChannel) => string;
  /** 复制链接后打开指定渠道（用于 Instagram 等无分享 URL 的平台） */
  onCopyAndOpen?: (channel: ShareChannel) => void;
}

type SocialShareChannel = Extract<
  ShareChannel,
  'facebook' | 'x' | 'pinterest' | 'instagram'
>;

const SOCIAL_CHANNELS: SocialShareChannel[] = [
  'facebook',
  'x',
  'pinterest',
  'instagram',
];

const CHANNEL_LABELS: Record<SocialShareChannel, string> = {
  facebook: 'Facebook',
  x: 'X',
  pinterest: 'Pinterest',
  instagram: 'Instagram',
};

const CHANNEL_ICONS: Record<
  SocialShareChannel,
  React.ComponentType<{ className?: string }>
> = {
  facebook: FacebookBrandIcon,
  x: XBrandIcon,
  pinterest: PinterestBrandIcon,
  instagram: InstagramBrandIcon,
};

export function ShareMenu({
  copied,
  onCopyLink,
  getChannelHref,
  onCopyAndOpen,
}: ShareMenuProps) {
  const CopyIcon = copied ? Check : Copy;

  return (
    <div
      role="menu"
      aria-label="Share options"
      className="absolute right-0 top-full z-20 mt-3 w-[360px] overflow-hidden rounded-[28px] border border-border/80 bg-background/95 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex gap-2">
          <button
            type="button"
            role="menuitem"
            aria-label="Copy product link"
            onClick={onCopyLink}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            <CopyIcon className="h-4 w-4" />
            <span>{copied ? 'Copied' : 'Copy product link'}</span>
          </button>
          <a
            role="menuitem"
            aria-label="Share via Email"
            href={getChannelHref('email')}
            className="flex items-center justify-center rounded-2xl bg-ink/5 px-3.5 py-3.5 transition hover:bg-ink/10"
          >
            <EmailBrandIcon className="h-6 w-6" />
          </a>
        </div>

        <div>
          <div className="mb-3 px-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
              Social media
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SOCIAL_CHANNELS.map(channel => {
              const Icon = CHANNEL_ICONS[channel];
              const isInstagram = channel === 'instagram';

              return (
                <a
                  key={channel}
                  role="menuitem"
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
                  <Icon className="h-9 w-9" />
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
