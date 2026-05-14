'use client';

import { Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildShareChannelUrl } from './build-share-channel-url';
import { ShareMenu } from './ShareMenu';
import { useShareActions } from './useShareActions';
import type { ShareChannel, ShareTarget } from './types';

interface ShareTriggerProps {
  target: ShareTarget;
  className?: string;
}

export function ShareTrigger({ target, className }: ShareTriggerProps) {
  const [open, setOpen] = useState(false);
  const { copied, isTouchDevice, copyLink, shareNatively } = useShareActions({
    target,
  });

  const copyLinkLegacy = () => {
    const input = document.createElement('textarea');
    input.value = target.url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(input);
    return copied;
  };

  useEffect(() => {
    if (!copied || !open) {
      return;
    }

    const timer = window.setTimeout(() => {
      setOpen(false);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied, open]);

  const handleCopyLink = async () => {
    const copied = await copyLink();
    if (copied) {
      return;
    }

    if (copyLinkLegacy()) {
      return;
    }

    window.prompt('Copy this product link', target.url);
  };

  const handleTriggerClick = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    if (isTouchDevice) {
      // 移动端：仅使用原生分享，不显示弹窗
      await shareNatively();
      return;
    }

    // 桌面端：直接显示分享弹窗
    setOpen(true);
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
          'group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/80 px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          open ? 'border-brand/30 bg-brand/5 text-brand' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          className={[
            'flex h-4 w-4 items-center justify-center text-ink-muted transition',
            open ? 'text-brand' : 'group-hover:text-ink',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Share2 className="h-3.5 w-3.5" />
        </span>
        <span>Share</span>
      </button>

      {open && (
        <div className="hidden sm:block">
          <ShareMenu
            copied={copied}
            onCopyLink={() => void handleCopyLink()}
            getChannelHref={getChannelHref}
          />
        </div>
      )}
    </div>
  );
}
