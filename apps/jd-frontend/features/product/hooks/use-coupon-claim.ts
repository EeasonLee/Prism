'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseCouponClaimOptions {
  sku: string;
  cpCode: string | null;
  isCouponValid: boolean;
  /** 优惠券过期时间（ISO 字符串），写入 localStorage 用于过期淘汰 */
  cpExpiresAt?: string | null;
}

interface UseCouponClaimResult {
  isClaimed: boolean;
  claimedCode: string | null;
  claim: () => void;
}

const STORAGE_KEY = 'claimed_coupons';

// ─── 存储格式（内部）──────────────────────────────────────────────────────────

interface ClaimedCouponEntry {
  code: string;
  /** 过期时间戳（毫秒），0 表示无过期时间（旧数据迁移） */
  expiresAt: number;
}

// ─── 底层读写 ─────────────────────────────────────────────────────────────────

function readRawEntries(): Record<string, ClaimedCouponEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const result: Record<string, ClaimedCouponEntry> = {};
    for (const [sku, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        // 旧格式：直接存 cpCode 字符串，迁移为无过期时间
        result[sku] = { code: value, expiresAt: 0 };
      } else if (value && typeof value === 'object' && 'code' in value) {
        const entry = value as ClaimedCouponEntry;
        result[sku] = { code: entry.code, expiresAt: entry.expiresAt ?? 0 };
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * 读取已领取的优惠券映射（sku → cpCode），自动过滤已过期条目。
 * 可在 hook 外部独立使用，不依赖 React。
 */
export function readClaimedCoupons(): Record<string, string> {
  const entries = readRawEntries();
  const now = Date.now();
  const result: Record<string, string> = {};
  for (const [sku, entry] of Object.entries(entries)) {
    // 有过期时间且已过期则跳过
    if (entry.expiresAt > 0 && now > entry.expiresAt) continue;
    result[sku] = entry.code;
  }
  return result;
}

function writeClaimedCoupons(
  coupons: Record<string, string>,
  newExpiresAt?: Record<string, number>
) {
  if (typeof window === 'undefined') return;
  try {
    // 读取现有条目以保留未被覆盖的 expiresAt
    const existing = readRawEntries();
    const toStore: Record<string, ClaimedCouponEntry> = {};
    for (const [sku, code] of Object.entries(coupons)) {
      toStore[sku] = {
        code,
        expiresAt: newExpiresAt?.[sku] ?? existing[sku]?.expiresAt ?? 0,
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // localStorage 不可用时静默降级
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCouponClaim({
  sku,
  cpCode,
  isCouponValid,
  cpExpiresAt,
}: UseCouponClaimOptions): UseCouponClaimResult {
  const [claimedMap, setClaimedMap] = useState<Record<string, string>>({});

  // mount 时读取 localStorage
  useEffect(() => {
    setClaimedMap(readClaimedCoupons());
  }, []);

  // 当优惠券失效时自动清除该 SKU 的领取记录
  useEffect(() => {
    if (!isCouponValid && claimedMap[sku]) {
      const next = { ...claimedMap };
      delete next[sku];
      setClaimedMap(next);
      writeClaimedCoupons(next);
    }
  }, [isCouponValid, sku]); // eslint-disable-line react-hooks/exhaustive-deps

  const isClaimed = useMemo(() => {
    if (!isCouponValid || !cpCode) return false;
    return claimedMap[sku] === cpCode;
  }, [claimedMap, sku, cpCode, isCouponValid]);

  const claimedCode = useMemo(() => {
    return isClaimed ? claimedMap[sku] : null;
  }, [isClaimed, claimedMap, sku]);

  const claim = useCallback(() => {
    if (!cpCode || !isCouponValid) return;
    const next = { ...claimedMap, [sku]: cpCode };
    setClaimedMap(next);

    // 计算该优惠券的过期时间戳，写入 localStorage 用于后续淘汰
    const expiresAtMap: Record<string, number> = {};
    if (cpExpiresAt) {
      const ts = new Date(cpExpiresAt).getTime();
      if (Number.isFinite(ts)) {
        expiresAtMap[sku] = ts;
      }
    }
    writeClaimedCoupons(next, expiresAtMap);
  }, [claimedMap, sku, cpCode, isCouponValid, cpExpiresAt]);

  return { isClaimed, claimedCode, claim };
}
