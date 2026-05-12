'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseCouponClaimOptions {
  sku: string;
  cpCode: string | null;
  isCouponValid: boolean;
}

interface UseCouponClaimResult {
  isClaimed: boolean;
  claimedCode: string | null;
  claim: () => void;
}

const STORAGE_KEY = 'claimed_coupons';

function readClaimedCoupons(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeClaimedCoupons(coupons: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  } catch {
    // localStorage 不可用时静默降级
  }
}

export function useCouponClaim({
  sku,
  cpCode,
  isCouponValid,
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
    writeClaimedCoupons(next);
  }, [claimedMap, sku, cpCode, isCouponValid]);

  return { isClaimed, claimedCode, claim };
}
