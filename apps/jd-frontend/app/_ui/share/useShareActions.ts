'use client';

import { useCallback, useMemo, useState } from 'react';
import { buildShareChannelUrl } from './build-share-channel-url';
import type {
  ShareActionHandlers,
  ShareActionState,
  ShareChannel,
  ShareTarget,
  ShareTargetResolver,
} from './types';

const COPIED_FEEDBACK_MS = 1500;

function resolveShareTarget(input: ShareTargetResolver): ShareTarget {
  return typeof input === 'function' ? input() : input;
}

/** 非安全上下文（如 http + 局域网 IP）下 Clipboard API 不可用时的回退 */
function copyTextWithExecCommand(url: string): boolean {
  if (typeof document === 'undefined') return false;
  const input = document.createElement('textarea');
  input.value = url;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(input);
  return ok;
}

interface UseShareActionsOptions {
  target: ShareTargetResolver;
}

type UseShareActionsResult = ShareActionState & ShareActionHandlers;

export function useShareActions({
  target,
}: UseShareActionsOptions): UseShareActionsResult {
  const [copied, setCopied] = useState(false);

  const showCopiedFeedback = useCallback(() => {
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, COPIED_FEEDBACK_MS);
  }, []);

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

  const copyLink = useCallback(async (): Promise<boolean> => {
    const resolved = resolveShareTarget(target);
    const url = resolved.url;

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        showCopiedFeedback();
        return true;
      } catch {
        // 权限被拒等：继续尝试 execCommand
      }
    }

    if (copyTextWithExecCommand(url)) {
      showCopiedFeedback();
      return true;
    }

    return false;
  }, [target, showCopiedFeedback]);

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
