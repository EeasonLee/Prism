'use client';

import { Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildShareChannelUrl } from './build-share-channel-url';
import { ShareMenu } from './ShareMenu';
import { useShareActions } from './useShareActions';
import type { ShareChannel, ShareTargetResolver } from './types';

interface ShareTriggerProps {
  target: ShareTargetResolver;
  className?: string;
}

function resolveShareTargetInput(input: ShareTargetResolver) {
  return typeof input === 'function' ? input() : input;
}

export function ShareTrigger({ target, className }: ShareTriggerProps) {
  const [open, setOpen] = useState(false);
  const { copied, isTouchDevice, copyLink, shareNatively } = useShareActions({
    target,
  });

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
    const ok = await copyLink();
    if (!ok) {
      window.prompt(
        'Copy this product link',
        resolveShareTargetInput(target).url
      );
    }
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
    buildShareChannelUrl(channel, resolveShareTargetInput(target));

  /** Instagram 等无分享 URL 的渠道：先复制链接，再打开首页 */
  const handleCopyAndOpen = async (channel: ShareChannel) => {
    await handleCopyLink();
    const url = buildShareChannelUrl(channel, resolveShareTargetInput(target));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
            onCopyAndOpen={channel => void handleCopyAndOpen(channel)}
          />
        </div>
      )}
    </div>
  );
}
