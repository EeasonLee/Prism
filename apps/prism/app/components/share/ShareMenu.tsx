'use client';

import type { ShareChannel } from './types';

interface ShareMenuProps {
  onCopyLink: () => void;
  getChannelHref: (channel: ShareChannel) => string;
}

const CHANNEL_LABELS: Record<ShareChannel, string> = {
  email: 'Email',
  facebook: 'Facebook',
};

export function ShareMenu({ onCopyLink, getChannelHref }: ShareMenuProps) {
  return (
    <div
      role="menu"
      aria-label="Share options"
      className="absolute right-0 top-full z-20 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
    >
      <div className="flex flex-col p-2">
        <button
          type="button"
          role="menuitem"
          onClick={onCopyLink}
          className="flex items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-surface"
        >
          Copy link
        </button>
        {(['email', 'facebook'] as ShareChannel[]).map(channel => (
          <a
            key={channel}
            role="menuitem"
            href={getChannelHref(channel)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface"
          >
            {CHANNEL_LABELS[channel]}
          </a>
        ))}
      </div>
    </div>
  );
}
