'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { buildShareChannelUrl } from './build-share-channel-url';
import { ShareMenu } from './ShareMenu';
import { ShareSheet } from './ShareSheet';
import { useShareActions } from './useShareActions';
import type { ShareChannel, ShareTarget } from './types';

interface ShareTriggerProps {
  target: ShareTarget;
  className?: string;
}

export function ShareTrigger({ target, className }: ShareTriggerProps) {
  const [open, setOpen] = useState(false);
  const { copyLink, shareNatively } = useShareActions({ target });

  const handleCopyLink = async () => {
    await copyLink();
    setOpen(false);
  };

  const handleTriggerClick = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    const shared = await shareNatively();
    if (!shared) {
      setOpen(true);
    }
  };

  const getChannelHref = (channel: ShareChannel) =>
    buildShareChannelUrl(channel, target);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        aria-label="Share"
        aria-expanded={open}
        onClick={() => void handleTriggerClick()}
        className={[
          'inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>

      {open && (
        <>
          <div className="hidden sm:block">
            <ShareMenu
              onCopyLink={() => void handleCopyLink()}
              getChannelHref={getChannelHref}
            />
          </div>
          <ShareSheet
            onClose={() => setOpen(false)}
            onCopyLink={() => void handleCopyLink()}
            getChannelHref={getChannelHref}
          />
        </>
      )}
    </div>
  );
}
