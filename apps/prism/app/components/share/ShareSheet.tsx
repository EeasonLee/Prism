'use client';

import type { ShareChannel } from './types';

interface ShareSheetProps {
  onClose: () => void;
  onCopyLink: () => void;
  getChannelHref: (channel: ShareChannel) => string;
}

const CHANNEL_LABELS: Record<ShareChannel, string> = {
  email: 'Email',
  facebook: 'Facebook',
};

export function ShareSheet({
  onClose,
  onCopyLink,
  getChannelHref,
}: ShareSheetProps) {
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
      <div className="relative z-10 w-full rounded-t-3xl bg-background p-4 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onCopyLink}
            className="rounded-2xl border border-border px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-surface"
          >
            Copy link
          </button>
          {(['email', 'facebook'] as ShareChannel[]).map(channel => (
            <a
              key={channel}
              href={getChannelHref(channel)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-border px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface"
            >
              {CHANNEL_LABELS[channel]}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
