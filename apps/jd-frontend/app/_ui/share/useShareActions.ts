'use client';

import { useCallback, useMemo, useState } from 'react';
import { buildShareChannelUrl } from './build-share-channel-url';
import type {
  ShareActionHandlers,
  ShareActionState,
  ShareChannel,
  ShareTargetResolver,
} from './types';

function resolveShareTarget(input: ShareTargetResolver): ShareTarget {
  return typeof input === 'function' ? input() : input;
}

interface UseShareActionsOptions {
  target: ShareTargetResolver;
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

  const isTouchDevice = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints > 0 ||
        (typeof window !== 'undefined' && 'ontouchstart' in window)),
    []
  );

  const copyLink = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return false;
    }

    try {
      const resolved = resolveShareTarget(target);
      await navigator.clipboard.writeText(resolved.url);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
      return true;
    } catch {
      return false;
    }
  }, [target]);

  const shareNatively = useCallback(async () => {
    if (!nativeShareSupported) {
      return false;
    }

    try {
      const resolved = resolveShareTarget(target);
      await navigator.share({
        title: resolved.title,
        text: resolved.text,
        url: resolved.url,
      });
      return true;
    } catch {
      return false;
    }
  }, [nativeShareSupported, target]);

  const openChannel = useCallback(
    (channel: ShareChannel) => {
      const resolved = resolveShareTarget(target);
      const url = buildShareChannelUrl(channel, resolved);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [target]
  );

  return {
    copied,
    nativeShareSupported,
    isTouchDevice,
    copyLink,
    shareNatively,
    openChannel,
  };
}
