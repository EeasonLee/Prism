'use client';

import { useCallback, useMemo, useState } from 'react';
import { buildShareChannelUrl } from './build-share-channel-url';
import type {
  ShareActionHandlers,
  ShareActionState,
  ShareChannel,
  ShareTarget,
} from './types';

interface UseShareActionsOptions {
  target: ShareTarget;
}

type UseShareActionsResult = ShareActionState & ShareActionHandlers;

export function useShareActions({
  target,
}: UseShareActionsOptions): UseShareActionsResult {
  const [copied, setCopied] = useState(false);

  const nativeShareSupported = useMemo(
    () =>
      typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    []
  );

  const copyLink = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(target.url);
    setCopied(true);
  }, [target.url]);

  const shareNatively = useCallback(async () => {
    if (!nativeShareSupported) {
      return false;
    }

    try {
      await navigator.share({
        title: target.title,
        text: target.text,
        url: target.url,
      });
      return true;
    } catch {
      return false;
    }
  }, [nativeShareSupported, target.text, target.title, target.url]);

  const openChannel = useCallback(
    (channel: ShareChannel) => {
      const url = buildShareChannelUrl(channel, target);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [target]
  );

  return {
    copied,
    nativeShareSupported,
    copyLink,
    shareNatively,
    openChannel,
  };
}
