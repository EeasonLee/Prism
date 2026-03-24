'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  MagentoConfigurableOption,
  MagentoProduct,
} from '../../../lib/api/magento/types';
import { AddToCartButton } from '../../components/AddToCartButton';

interface ProductDetailClientProps {
  product: MagentoProduct;
}

// ─── 数量输入框 ───────────────────────────────────────────────────────────────

function QtyInput({
  value,
  min = 0,
  onChange,
}: {
  value: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink transition hover:bg-surface"
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-semibold text-ink">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink transition hover:bg-surface"
      >
        +
      </button>
    </div>
  );
}

// ─── Simple / Virtual ────────────────────────────────────────────────────────

function SimpleOptions({ product }: { product: MagentoProduct }) {
  const [qty, setQty] = useState(1);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Quantity</p>
        <QtyInput value={qty} min={1} onChange={setQty} />
      </div>
      <AddToCartButton sku={product.sku} qty={qty} />
    </div>
  );
}

// ─── Configurable ─────────────────────────────────────────────────────────────

function ConfigurableOptions({ product }: { product: MagentoProduct }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const configurableOptions: MagentoConfigurableOption[] =
    product.configurable_options ??
    product.extension_attributes?.configurable_product_options ??
    [];

  const children = product.children ?? [];

  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, number>
  >({});
  const [qty, setQty] = useState(1);

  const findChildSku = (attrs: Record<string, number>): string | null => {
    const child = children.find(item =>
      configurableOptions.every(option => {
        const selectedValue = attrs[option.attribute_id];
        if (selectedValue === undefined) {
          return false;
        }

        const childValueById = item.attributes[option.attribute_id];
        if (childValueById != null) {
          return childValueById === String(selectedValue);
        }

        if (!option.attribute_code) {
          return false;
        }

        const childValueByCode = item.attributes[option.attribute_code];
        if (childValueByCode != null) {
          if (childValueByCode === String(selectedValue)) {
            return true;
          }

          const selectedOption = option.values.find(
            value => value.value_index === selectedValue
          );
          return selectedOption?.label === childValueByCode;
        }

        return false;
      })
    );

    return child?.sku ?? null;
  };

  const findAttributesBySku = (
    childSku: string
  ): Record<string, number> | null => {
    const child = children.find(item => item.sku === childSku);
    if (!child) {
      return null;
    }

    const attrs: Record<string, number> = {};

    for (const option of configurableOptions) {
      const childValueById = child.attributes[option.attribute_id];
      if (childValueById != null) {
        const selectedValue = Number(childValueById);
        const hasMatchingValue = option.values.some(
          value => value.value_index === selectedValue
        );

        if (!hasMatchingValue) {
          return null;
        }

        attrs[option.attribute_id] = selectedValue;
        continue;
      }

      if (!option.attribute_code) {
        return null;
      }

      const childValueByCode = child.attributes[option.attribute_code];
      if (!childValueByCode) {
        return null;
      }

      const selectedByValueIndex = option.values.find(
        value => String(value.value_index) === childValueByCode
      );
      if (selectedByValueIndex) {
        attrs[option.attribute_id] = selectedByValueIndex.value_index;
        continue;
      }

      const selectedByLabel = option.values.find(
        value => value.label === childValueByCode
      );
      if (!selectedByLabel) {
        return null;
      }

      attrs[option.attribute_id] = selectedByLabel.value_index;
    }

    return attrs;
  };

  useEffect(() => {
    if (children.length === 0) {
      return;
    }

    const variantSku = searchParams?.get('variant');
    if (!variantSku) {
      return;
    }

    const attrs = findAttributesBySku(variantSku);
    if (!attrs) {
      return;
    }

    setSelectedAttributes(prev => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(attrs);
      const isSameSelection =
        prevKeys.length === nextKeys.length &&
        nextKeys.every(key => prev[key] === attrs[key]);

      return isSameSelection ? prev : attrs;
    });
  }, [children, configurableOptions, searchParams]);

  const allSelected = configurableOptions.every(
    option => selectedAttributes[option.attribute_id] !== undefined
  );

  useEffect(() => {
    if (!allSelected || children.length === 0) {
      return;
    }

    const childSku = findChildSku(selectedAttributes);
    if (!childSku) {
      return;
    }

    const currentVariant = searchParams?.get('variant');
    if (currentVariant === childSku) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');
    nextParams.set('variant', childSku);
    const nextUrl = `/products/${encodeURIComponent(
      product.sku
    )}?${nextParams.toString()}`;
    router.replace(nextUrl, { scroll: false });
  }, [
    allSelected,
    children,
    product.sku,
    router,
    searchParams,
    selectedAttributes,
  ]);

  const productOptionsJson = allSelected
    ? JSON.stringify({ super_attribute: selectedAttributes })
    : undefined;

  return (
    <div className="space-y-6">
      {configurableOptions.map(option => (
        <div key={option.id}>
          <p className="mb-2 text-sm font-medium text-ink">{option.label}</p>
          <div className="flex flex-wrap gap-2">
            {option.values.map(val => {
              const isSelected =
                selectedAttributes[option.attribute_id] === val.value_index;
              return (
                <button
                  key={val.value_index}
                  type="button"
                  onClick={() =>
                    setSelectedAttributes(prev => ({
                      ...prev,
                      [option.attribute_id]: val.value_index,
                    }))
                  }
                  className={`rounded-lg border px-3.5 py-2 text-sm transition ${
                    isSelected
                      ? 'border-brand bg-brand/10 font-semibold text-brand'
                      : 'border-border text-ink hover:border-brand/40 hover:bg-surface'
                  }`}
                >
                  {val.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Quantity</p>
        <QtyInput value={qty} min={1} onChange={setQty} />
      </div>

      <AddToCartButton
        sku={product.sku}
        qty={qty}
        productOptionsJson={productOptionsJson}
        disabled={!allSelected}
        disabledLabel="Select Options"
      />
    </div>
  );
}

// ─── Grouped ─────────────────────────────────────────────────────────────────

function GroupedOptions({ product }: { product: MagentoProduct }) {
  const items = product.grouped_items ?? [];

  const [qtys, setQtys] = useState<Record<number, number>>(() =>
    Object.fromEntries(items.map(item => [item.id, item.default_qty ?? 1]))
  );

  const hasAny = Object.values(qtys).some(q => q > 0);

  const productOptionsJson = JSON.stringify({
    super_group: Object.fromEntries(
      Object.entries(qtys).map(([id, q]) => [id, q])
    ),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {item.thumbnail_url && (
                <Image
                  src={item.thumbnail_url}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-md object-contain"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {item.name}
                </p>
                <p className="text-xs text-ink-muted">
                  ${item.price.toFixed(2)}
                  {!item.is_in_stock && (
                    <span className="ml-2 text-red-500">Out of stock</span>
                  )}
                </p>
              </div>
            </div>
            <QtyInput
              value={qtys[item.id] ?? 0}
              min={0}
              onChange={v => setQtys(prev => ({ ...prev, [item.id]: v }))}
            />
          </div>
        ))}
      </div>

      <AddToCartButton
        sku={product.sku}
        qty={1}
        productOptionsJson={productOptionsJson}
        disabled={!hasAny}
        disabledLabel="Select at least one item"
      />
    </div>
  );
}

// ─── Bundle ───────────────────────────────────────────────────────────────────

function BundleOptions({ product }: { product: MagentoProduct }) {
  const options = product.bundle_options ?? [];

  // single-select options: Record<optionId, selectionId>
  const [singleSelections, setSingleSelections] = useState<
    Record<number, number | null>
  >(() =>
    Object.fromEntries(
      options
        .filter(o => o.type === 'select' || o.type === 'radio')
        .map(o => {
          const def = o.selections.find(s => s.is_default);
          return [o.option_id, def ? def.selection_id : null];
        })
    )
  );

  // multi-select options: Record<optionId, Set<selectionId>>
  const [multiSelections, setMultiSelections] = useState<
    Record<number, Set<number>>
  >(() =>
    Object.fromEntries(
      options
        .filter(o => o.type === 'checkbox' || o.type === 'multi')
        .map(o => {
          const defaults = o.selections
            .filter(s => s.is_default)
            .map(s => s.selection_id);
          return [o.option_id, new Set(defaults)];
        })
    )
  );

  // qty per option (when can_change_qty=true)
  const [optionQtys, setOptionQtys] = useState<Record<number, number>>(() =>
    Object.fromEntries(
      options.map(o => [
        o.option_id,
        o.selections.find(s => s.is_default)?.default_qty ?? 1,
      ])
    )
  );

  const [qty, setQty] = useState(1);

  // 校验所有 required 选项是否已选
  const allRequiredSelected = options
    .filter(o => o.required)
    .every(o => {
      if (o.type === 'select' || o.type === 'radio') {
        return singleSelections[o.option_id] != null;
      }
      return (multiSelections[o.option_id]?.size ?? 0) > 0;
    });

  // 构建 bundle_option / bundle_option_qty
  const buildOptionsJson = () => {
    const bundleOption: Record<number, string | string[]> = {};
    const bundleOptionQty: Record<number, number> = {};

    for (const opt of options) {
      if (opt.type === 'select' || opt.type === 'radio') {
        const sel = singleSelections[opt.option_id];
        if (sel != null) {
          bundleOption[opt.option_id] = String(sel);
          bundleOptionQty[opt.option_id] = optionQtys[opt.option_id] ?? 1;
        }
      } else {
        const sels = [...(multiSelections[opt.option_id] ?? [])];
        if (sels.length > 0) {
          bundleOption[opt.option_id] = sels.map(String);
          bundleOptionQty[opt.option_id] = optionQtys[opt.option_id] ?? 1;
        }
      }
    }

    return JSON.stringify({
      bundle_option: bundleOption,
      bundle_option_qty: bundleOptionQty,
    });
  };

  return (
    <div className="space-y-6">
      {options.map(opt => (
        <div key={opt.option_id}>
          <p className="mb-2 text-sm font-medium text-ink">
            {opt.title}
            {opt.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </p>

          {(opt.type === 'select' || opt.type === 'radio') && (
            <div className="flex flex-wrap gap-2">
              {opt.selections.map(sel => {
                const isSelected =
                  singleSelections[opt.option_id] === sel.selection_id;
                return (
                  <button
                    key={sel.selection_id}
                    type="button"
                    disabled={!sel.is_in_stock}
                    onClick={() =>
                      setSingleSelections(prev => ({
                        ...prev,
                        [opt.option_id]: sel.selection_id,
                      }))
                    }
                    className={`rounded-lg border px-3.5 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? 'border-brand bg-brand/10 font-semibold text-brand'
                        : 'border-border text-ink hover:border-brand/40 hover:bg-surface'
                    }`}
                  >
                    {sel.name}
                    {sel.price > 0 && (
                      <span className="ml-1 text-xs text-ink-muted">
                        +${sel.price.toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {(opt.type === 'checkbox' || opt.type === 'multi') && (
            <div className="space-y-2">
              {opt.selections.map(sel => {
                const isChecked =
                  multiSelections[opt.option_id]?.has(sel.selection_id) ??
                  false;
                return (
                  <label
                    key={sel.selection_id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      isChecked
                        ? 'border-brand bg-brand/5'
                        : 'border-border hover:bg-surface'
                    } ${
                      !sel.is_in_stock ? 'cursor-not-allowed opacity-40' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!sel.is_in_stock}
                      onChange={e => {
                        setMultiSelections(prev => {
                          const next = new Set(prev[opt.option_id] ?? []);
                          if (e.target.checked) {
                            next.add(sel.selection_id);
                          } else {
                            next.delete(sel.selection_id);
                          }
                          return { ...prev, [opt.option_id]: next };
                        });
                      }}
                      className="accent-brand"
                    />
                    <span className="flex-1 text-sm text-ink">{sel.name}</span>
                    {sel.price > 0 && (
                      <span className="text-xs text-ink-muted">
                        +${sel.price.toFixed(2)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {/* 可变数量输入 */}
          {opt.selections.some(s => s.can_change_qty) && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-ink-muted">Quantity</p>
              <QtyInput
                value={optionQtys[opt.option_id] ?? 1}
                min={1}
                onChange={v =>
                  setOptionQtys(prev => ({ ...prev, [opt.option_id]: v }))
                }
              />
            </div>
          )}
        </div>
      ))}

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Quantity</p>
        <QtyInput value={qty} min={1} onChange={setQty} />
      </div>

      <AddToCartButton
        sku={product.sku}
        qty={qty}
        productOptionsJson={buildOptionsJson()}
        disabled={!allRequiredSelected}
        disabledLabel="Select required options"
      />
    </div>
  );
}

// ─── Downloadable ─────────────────────────────────────────────────────────────

function DownloadableOptions({ product }: { product: MagentoProduct }) {
  const links = product.downloadable_links ?? [];
  const samples = product.downloadable_samples ?? [];
  const purchaseSeparately = product.links_purchased_separately ?? false;

  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(
    () => new Set(links.map(l => l.link_id))
  );
  const [qty, setQty] = useState(1);

  const toggleLink = (id: number) => {
    setSelectedLinks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canAddToCart = !purchaseSeparately || selectedLinks.size > 0;

  const productOptionsJson = purchaseSeparately
    ? JSON.stringify({ links: [...selectedLinks] })
    : undefined;

  return (
    <div className="space-y-6">
      {/* 免费样本 */}
      {samples.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Samples</p>
          <div className="flex flex-wrap gap-2">
            {samples.map(s => (
              <a
                key={s.sample_id}
                href={s.sample_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-brand transition hover:bg-surface"
              >
                Preview: {s.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 可下载链接选择 */}
      {purchaseSeparately && links.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">
            Select download links
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          </p>
          <div className="space-y-2">
            {links.map(link => {
              const isChecked = selectedLinks.has(link.link_id);
              return (
                <label
                  key={link.link_id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                    isChecked
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:bg-surface'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleLink(link.link_id)}
                    className="accent-brand"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{link.title}</p>
                    {link.number_of_downloads > 0 && (
                      <p className="text-xs text-ink-muted">
                        {link.number_of_downloads} downloads
                      </p>
                    )}
                    {link.number_of_downloads === 0 && (
                      <p className="text-xs text-ink-muted">
                        Unlimited downloads
                      </p>
                    )}
                  </div>
                  {link.price > 0 && (
                    <span className="shrink-0 text-sm font-semibold text-ink">
                      ${link.price.toFixed(2)}
                    </span>
                  )}
                  {link.sample_url && (
                    <a
                      href={link.sample_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-xs text-brand hover:underline"
                    >
                      Preview
                    </a>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Quantity</p>
        <QtyInput value={qty} min={1} onChange={setQty} />
      </div>

      <AddToCartButton
        sku={product.sku}
        qty={qty}
        productOptionsJson={productOptionsJson}
        disabled={!canAddToCart}
        disabledLabel="Select at least one link"
      />
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  switch (product.type_id) {
    case 'configurable':
      return <ConfigurableOptions product={product} />;
    case 'grouped':
      return <GroupedOptions product={product} />;
    case 'bundle':
      return <BundleOptions product={product} />;
    case 'downloadable':
      return <DownloadableOptions product={product} />;
    default:
      // simple / virtual
      return <SimpleOptions product={product} />;
  }
}
