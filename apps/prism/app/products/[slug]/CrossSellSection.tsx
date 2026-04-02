'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Plus, Check, Tag } from 'lucide-react';
import type { CrossSellAddon, BundleDeal } from './mock-data';

// ─── 超值加购（Add-on accessories at discount） ───────────────────────────────

interface CrossSellAddonsProps {
  addons: CrossSellAddon[];
  mainProductPrice: number; // 主商品当前价
}

export function CrossSellAddons({
  addons,
  mainProductPrice,
}: CrossSellAddonsProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addonsTotal = addons
    .filter(a => selected.has(a.id))
    .reduce((sum, a) => sum + a.addon_price, 0);

  const total = mainProductPrice + addonsTotal;
  const hasSelected = selected.size > 0;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Tag className="h-4 w-4 text-brand" />
        <span className="text-sm font-semibold text-ink">
          Add-on Deals — Save more when buying together
        </span>
      </div>

      <div className="divide-y divide-border">
        {addons.map(addon => {
          const isSelected = selected.has(addon.id);
          const saving = addon.original_price - addon.addon_price;

          return (
            <label
              key={addon.id}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition ${
                isSelected ? 'bg-brand/5' : 'hover:bg-surface-muted'
              }`}
            >
              {/* Checkbox */}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                  isSelected
                    ? 'border-brand bg-brand text-brand-foreground'
                    : 'border-border bg-background'
                }`}
                aria-hidden="true"
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={isSelected}
                onChange={() => toggle(addon.id)}
                aria-label={`Add ${addon.name} for $${addon.addon_price.toFixed(
                  2
                )}`}
              />

              {/* Image */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-background">
                <Image
                  src={addon.image}
                  alt={addon.name}
                  fill
                  unoptimized
                  sizes="48px"
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-ink">
                  {addon.name}
                </p>
                <p className="truncate text-[11px] text-ink-muted">
                  {addon.description}
                </p>
              </div>

              {/* Price */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-ink">
                  +${addon.addon_price.toFixed(2)}
                </p>
                <p className="text-[10px] text-ink-muted line-through">
                  ${addon.original_price.toFixed(2)}
                </p>
                <p className="text-[10px] font-semibold text-emerald-600">
                  Save ${saving.toFixed(2)}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* 汇总行 */}
      {hasSelected && (
        <div className="flex items-center justify-between border-t border-brand/20 bg-brand/5 px-4 py-3">
          <div className="text-sm">
            <span className="text-ink-muted">
              {selected.size} add-on{selected.size > 1 ? 's' : ''} selected{' '}
            </span>
            <span className="font-semibold text-ink">
              Total: ${total.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground transition hover:bg-brand/90"
          >
            Add Selected
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 加购优惠（Bundle & Save） ─────────────────────────────────────────────────

interface BundleDealsProps {
  deals: BundleDeal[];
  mainProduct: { name: string; image: string; price: number };
}

export function BundleDeals({ deals, mainProduct }: BundleDealsProps) {
  const [activeDeal, setActiveDeal] = useState(0);

  const deal = deals[activeDeal];
  if (!deal) return null;

  return (
    <div className="mt-4 rounded-2xl border border-brand/25 bg-brand/5">
      <div className="flex items-center gap-2 border-b border-brand/20 px-4 py-3">
        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground">
          BUNDLE & SAVE
        </span>
        <span className="text-sm font-semibold text-ink">
          Buy Together for Less
        </span>
      </div>

      {/* 套装切换 tabs（多套装时显示） */}
      {deals.length > 1 && (
        <div className="flex gap-2 border-b border-brand/20 px-4 py-2">
          {deals.map((d, idx) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDeal(idx)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                idx === activeDeal
                  ? 'bg-brand text-brand-foreground'
                  : 'bg-background text-ink-muted hover:bg-surface'
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        {/* 产品组合展示 */}
        <div className="mb-4 flex items-center gap-3">
          {/* 主商品 */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-background">
              <Image
                src={mainProduct.image}
                alt={mainProduct.name}
                fill
                unoptimized
                sizes="64px"
                className="object-contain p-1"
              />
            </div>
            <span className="max-w-[72px] text-center text-[10px] text-ink-muted line-clamp-2">
              {mainProduct.name}
            </span>
          </div>

          {/* 加号 */}
          {deal.partner_products.map(partner => (
            <div key={partner.sku} className="flex items-center gap-3">
              <Plus className="h-5 w-5 shrink-0 text-ink-muted" />
              <div className="flex flex-col items-center gap-1">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-background">
                  <Image
                    src={partner.image}
                    alt={partner.name}
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </div>
                <span className="max-w-[72px] text-center text-[10px] text-ink-muted line-clamp-2">
                  {partner.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mb-4 text-xs leading-relaxed text-ink-muted">
          {deal.description}
        </p>

        {/* 价格 + CTA */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-ink">
                ${deal.bundle_price.toFixed(2)}
              </span>
              <span className="text-sm text-ink-muted line-through">
                ${deal.original_total.toFixed(2)}
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              You save ${deal.savings.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90"
          >
            Add Bundle to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
