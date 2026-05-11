'use client';

import { useEffect } from 'react';

/**
 * 锁定 body 滚动，同时补偿滚动条宽度防止布局偏移。
 *
 * @param locked - 是否锁定（true = 锁定，false = 解锁）
 * @param enabled - 可选条件，仅当 enabled 为 true 时才锁定（用于移动端等场景）
 *
 * @example
 * // 基本用法
 * useBodyScrollLock(open);
 *
 * @example
 * // 仅在移动端锁定
 * useBodyScrollLock(open, window.innerWidth < 768);
 */
export function useBodyScrollLock(locked: boolean, enabled = true) {
  useEffect(() => {
    if (!locked || !enabled) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [locked, enabled]);
}
