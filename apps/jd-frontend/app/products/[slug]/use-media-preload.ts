import { useEffect, useMemo, useRef, useState } from 'react';

interface MediaPreloadItem {
  kind: 'image' | 'video';
  imageUrl?: string | null;
  posterUrl?: string | null;
}

interface UseMediaPreloadOptions {
  items: MediaPreloadItem[];
  activeIndex: number;
  enabled?: boolean;
  immediateDistance?: number;
  idleDistance?: number;
}

interface UseMediaPreloadResult {
  isReady: (index: number) => boolean;
}

type IdleCallbackHandle = number;
type IdleCallback = (deadline: {
  didTimeout: boolean;
  timeRemaining: () => number;
}) => void;

function requestIdle(callback: IdleCallback): IdleCallbackHandle {
  const maybeRequestIdle = window.requestIdleCallback;
  if (typeof maybeRequestIdle === 'function') {
    return maybeRequestIdle(callback);
  }
  return window.setTimeout(
    () =>
      callback({
        didTimeout: false,
        timeRemaining: () => 0,
      }),
    120
  );
}

function cancelIdle(handle: IdleCallbackHandle) {
  const maybeCancelIdle = window.cancelIdleCallback;
  if (typeof maybeCancelIdle === 'function') {
    maybeCancelIdle(handle);
    return;
  }
  window.clearTimeout(handle);
}

function circularDistance(
  target: number,
  center: number,
  total: number
): number {
  if (total <= 1) return 0;
  const direct = Math.abs(target - center);
  return Math.min(direct, total - direct);
}

function preloadImage(url: string, onReady: () => void) {
  const image = new Image();
  const markReady = () => {
    onReady();
  };

  image.onload = () => {
    if (typeof image.decode === 'function') {
      void image.decode().then(markReady).catch(markReady);
      return;
    }
    markReady();
  };
  image.onerror = markReady;
  image.src = url;
}

export function useMediaPreload({
  items,
  activeIndex,
  enabled = true,
  immediateDistance = 2,
  idleDistance = 4,
}: UseMediaPreloadOptions): UseMediaPreloadResult {
  const [readySet, setReadySet] = useState<Set<number>>(() => new Set());
  const preloadCacheRef = useRef<Set<string>>(new Set());
  const itemSignature = useMemo(
    () =>
      items
        .map(
          item => `${item.kind}|${item.imageUrl ?? ''}|${item.posterUrl ?? ''}`
        )
        .join('||'),
    [items]
  );
  const stableItems = useMemo(() => items, [itemSignature]);

  useEffect(() => {
    setReadySet(new Set());
    preloadCacheRef.current = new Set();
  }, [itemSignature]);

  const activeSafeIndex = useMemo(() => {
    if (stableItems.length === 0) return 0;
    if (activeIndex < 0) return 0;
    if (activeIndex >= stableItems.length) return stableItems.length - 1;
    return activeIndex;
  }, [activeIndex, stableItems.length]);

  useEffect(() => {
    if (!enabled || stableItems.length === 0) {
      return;
    }

    const markReady = (index: number) => {
      setReadySet(current => {
        if (current.has(index)) return current;
        const next = new Set(current);
        next.add(index);
        return next;
      });
    };

    const preloadIndex = (index: number) => {
      const item = stableItems[index];
      if (!item) return;

      const preloadUrl =
        item.kind === 'image' ? item.imageUrl ?? null : item.posterUrl ?? null;
      if (!preloadUrl) {
        markReady(index);
        return;
      }
      if (preloadCacheRef.current.has(preloadUrl)) {
        markReady(index);
        return;
      }
      preloadCacheRef.current.add(preloadUrl);
      preloadImage(preloadUrl, () => markReady(index));
    };

    const immediateIndexes: number[] = [];
    const idleIndexes: number[] = [];

    stableItems.forEach((_item, index) => {
      const distance = circularDistance(
        index,
        activeSafeIndex,
        stableItems.length
      );
      if (distance <= immediateDistance) {
        immediateIndexes.push(index);
        return;
      }
      if (distance <= idleDistance) {
        idleIndexes.push(index);
      }
    });

    immediateIndexes.forEach(preloadIndex);

    const idleHandle = requestIdle(() => {
      idleIndexes.forEach(preloadIndex);
    });

    return () => {
      cancelIdle(idleHandle);
    };
  }, [activeSafeIndex, enabled, idleDistance, immediateDistance, stableItems]);

  return {
    isReady: (index: number) => readySet.has(index),
  };
}
