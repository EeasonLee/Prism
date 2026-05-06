'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { debounce } from '@prism/shared';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@/shared/utils/format-price';
import type { ProductCardItem } from './types';
import type { ArticleListItem } from '@prism/blog';
import type { SearchRecipeItem } from '../../app/recipes/types';

interface GlobalSearchResponse {
  products: { items: ProductCardItem[]; total: number };
  articles: {
    items: Array<ArticleListItem & { title: string; excerpt: string }>;
    total: number;
  };
  recipes: { items: SearchRecipeItem[]; total: number };
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HighlightedText({ html }: { html: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: html.replace(
          /<mark>/g,
          '<mark class="bg-yellow-200 text-yellow-900 font-semibold px-0.5 rounded">'
        ),
      }}
    />
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-ink-muted">No matching results</p>
      <p className="mt-1 text-xs text-ink-muted/70">Try different keywords</p>
    </div>
  );
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GlobalSearchResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreCloseUntilRef = useRef<number>(0);

  const hasResults =
    data &&
    (data.products.items.length > 0 ||
      data.articles.items.length > 0 ||
      data.recipes.items.length > 0);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        if (!q.trim()) {
          setData(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const res = await fetch(
            `/api/global-search?q=${encodeURIComponent(q.trim())}`,
            { signal: controller.signal }
          );
          if (!controller.signal.aborted && res.ok) {
            const json = (await res.json()) as GlobalSearchResponse;
            setData(json);
          }
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('Global search failed:', err);
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }, 300),
    []
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setKeyword(value);
      if (value.trim()) {
        debouncedSearch(value);
      } else {
        setData(null);
      }
    },
    [debouncedSearch]
  );

  const close = useCallback(() => {
    onOpenChange(false);
    setKeyword('');
    setData(null);
  }, [onOpenChange]);

  // Focus input when opened
  useEffect(() => {
    if (!open) return undefined;
    ignoreCloseUntilRef.current = Date.now() + 150;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Click outside to close (desktop dropdown only)
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (Date.now() < ignoreCloseUntilRef.current) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, close]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, close]);

  const handleSubmit = useCallback(() => {
    const q = keyword.trim();
    if (!q) return;
    if (data?.products.items.length) {
      router.push(data.products.items[0].href);
    } else if (data?.articles.items.length) {
      const item = data.articles.items[0];
      const cat = item.categories?.[0]?.slug || 'all';
      router.push(`/blog/${cat}/${item.slug}`);
    } else if (data?.recipes.items.length) {
      const item = data.recipes.items[0];
      const cat = item.categories?.[0]?.slug || 'all';
      router.push(`/recipes/${cat}/${item.slug}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
    close();
  }, [keyword, data, router, close]);

  if (!open) return null;

  return (
    <>
      {/* Mobile: full-screen overlay */}
      <div className="fixed inset-0 z-40 md:hidden">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => {
            if (Date.now() < ignoreCloseUntilRef.current) return;
            close();
          }}
          aria-hidden="true"
        />
        <div
          ref={containerRef}
          className="absolute inset-x-0 top-0 z-50 bg-surface-muted px-4 pb-4 pt-[env(safe-area-inset-top)] shadow-xl"
        >
          <div className="flex h-[73px] items-center gap-3">
            <div className="relative flex flex-1 items-center overflow-hidden rounded-xl border border-border bg-background">
              <div className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center pl-3 pr-1">
                <svg
                  className="h-5 w-5 text-ink-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={keyword}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Search products, articles, recipes..."
                className="min-h-[44px] flex-1 border-none bg-transparent py-2 pl-1 pr-3 text-base text-ink placeholder:text-ink-muted focus:outline-none"
              />
              {loading && (
                <div className="flex min-h-[44px] items-center justify-center pr-3">
                  <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
                </div>
              )}
              {keyword && !loading && (
                <button
                  type="button"
                  onClick={() => handleInputChange('')}
                  className="mr-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                  aria-label="Clear search"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              className="min-h-[44px] px-2 text-sm font-medium text-ink"
            >
              Cancel
            </button>
          </div>

          {/* Mobile results */}
          <div className="max-h-[calc(100vh-100px)] overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
            {!data && !loading && (
              <div className="py-8 text-center text-sm text-ink-muted">
                Type to search
              </div>
            )}
            {loading && !data && (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-ink-muted" />
              </div>
            )}
            {data && !loading && !hasResults && <EmptyState />}
            {data && (
              <>
                {data.products.items.length > 0 && (
                  <div>
                    <SectionTitle>
                      Products ({data.products.total})
                    </SectionTitle>
                    <ul className="divide-y divide-border">
                      {data.products.items.map(item => (
                        <li key={item.sku}>
                          <Link
                            href={item.href}
                            onClick={close}
                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface"
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                              {item.thumbnail ? (
                                <Image
                                  src={item.thumbnail}
                                  alt={item.name}
                                  fill
                                  unoptimized
                                  sizes="48px"
                                  className="object-contain p-1"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-ink-muted/30">
                                  <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">
                                {item.name}
                              </p>
                              {item.price != null && (
                                <p className="text-xs text-ink-muted">
                                  {formatPrice(item.price, item.currency)}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {data.products.total > data.products.items.length && (
                      <div className="px-4 py-2">
                        <Link
                          href={`/search?q=${encodeURIComponent(keyword)}`}
                          onClick={close}
                          className="block text-sm font-medium text-brand hover:underline"
                        >
                          View all products
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                {data.articles.items.length > 0 && (
                  <div>
                    <SectionTitle>
                      Articles ({data.articles.total})
                    </SectionTitle>
                    <ul className="divide-y divide-border">
                      {data.articles.items.map(item => (
                        <li key={item.id}>
                          <Link
                            href={`/blog/${
                              item.categories?.[0]?.slug || 'all'
                            }/${item.slug}`}
                            onClick={close}
                            className="block px-4 py-3 transition hover:bg-surface"
                          >
                            <p className="text-sm font-medium text-ink">
                              <HighlightedText html={item.title} />
                            </p>
                            {item.excerpt && (
                              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                                <HighlightedText html={item.excerpt} />
                              </p>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {data.articles.total > data.articles.items.length && (
                      <div className="px-4 py-2">
                        <Link
                          href={`/blog?q=${encodeURIComponent(keyword)}`}
                          onClick={close}
                          className="block text-sm font-medium text-brand hover:underline"
                        >
                          View all articles
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                {data.recipes.items.length > 0 && (
                  <div>
                    <SectionTitle>Recipes ({data.recipes.total})</SectionTitle>
                    <ul className="divide-y divide-border">
                      {data.recipes.items.map(item => (
                        <li key={item.id}>
                          <Link
                            href={`/recipes/${
                              item.categories?.[0]?.slug || 'all'
                            }/${item.slug}`}
                            onClick={close}
                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface"
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                              {item.thumbnail ? (
                                <Image
                                  src={item.thumbnail}
                                  alt={item.title}
                                  fill
                                  unoptimized
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-ink-muted/30">
                                  <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">
                                {item.highlight?.title ? (
                                  <HighlightedText
                                    html={item.highlight.title}
                                  />
                                ) : (
                                  item.title
                                )}
                              </p>
                              {item.summary && (
                                <p className="mt-1 line-clamp-1 text-xs text-ink-muted">
                                  {item.highlight?.summary ? (
                                    <HighlightedText
                                      html={item.highlight.summary}
                                    />
                                  ) : (
                                    item.summary
                                  )}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {data.recipes.total > data.recipes.items.length && (
                      <div className="px-4 py-2">
                        <Link
                          href={`/recipes?q=${encodeURIComponent(keyword)}`}
                          onClick={close}
                          className="block text-sm font-medium text-brand hover:underline"
                        >
                          View all recipes
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: dropdown under header */}
      <div className="hidden md:block">
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => {
            if (Date.now() < ignoreCloseUntilRef.current) return;
            close();
          }}
          aria-hidden="true"
        />
        <div
          ref={containerRef}
          className="absolute left-1/2 top-[73px] z-40 w-full max-w-2xl -translate-x-1/2"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="relative flex flex-1 items-center overflow-hidden rounded-xl border border-border bg-surface">
                <div className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center pl-3 pr-1">
                  <svg
                    className="h-5 w-5 text-ink-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={keyword}
                  onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Search products, articles, recipes..."
                  className="min-h-[40px] flex-1 border-none bg-transparent py-2 pl-1 pr-3 text-base text-ink placeholder:text-ink-muted focus:outline-none"
                />
                {loading && (
                  <div className="flex min-h-[40px] items-center justify-center pr-3">
                    <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
                  </div>
                )}
                {keyword && !loading && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('')}
                    className="mr-2 flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                    aria-label="Clear search"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {!data && !loading && (
                <div className="py-8 text-center text-sm text-ink-muted">
                  Type to search across products, articles, and recipes
                </div>
              )}
              {loading && !data && (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-ink-muted" />
                </div>
              )}
              {data && !loading && !hasResults && <EmptyState />}
              {data && (
                <div className="divide-y divide-border">
                  {data.products.items.length > 0 && (
                    <div className="py-2">
                      <SectionTitle>
                        Products ({data.products.total})
                      </SectionTitle>
                      <ul className="grid grid-cols-1 gap-1 px-2">
                        {data.products.items.map(item => (
                          <li key={item.sku}>
                            <Link
                              href={item.href}
                              onClick={close}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-surface"
                            >
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                                {item.thumbnail ? (
                                  <Image
                                    src={item.thumbnail}
                                    alt={item.name}
                                    fill
                                    unoptimized
                                    sizes="40px"
                                    className="object-contain p-1"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-ink-muted/30">
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink">
                                  {item.name}
                                </p>
                                {item.price != null && (
                                  <p className="text-xs text-ink-muted">
                                    {formatPrice(item.price, item.currency)}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {data.products.total > data.products.items.length && (
                        <div className="px-4 pt-2">
                          <Link
                            href={`/search?q=${encodeURIComponent(keyword)}`}
                            onClick={close}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            View all products
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                  {data.articles.items.length > 0 && (
                    <div className="py-2">
                      <SectionTitle>
                        Articles ({data.articles.total})
                      </SectionTitle>
                      <ul className="px-2">
                        {data.articles.items.map(item => (
                          <li key={item.id}>
                            <Link
                              href={`/blog/${
                                item.categories?.[0]?.slug || 'all'
                              }/${item.slug}`}
                              onClick={close}
                              className="block rounded-lg px-3 py-2 transition hover:bg-surface"
                            >
                              <p className="text-sm font-medium text-ink">
                                <HighlightedText html={item.title} />
                              </p>
                              {item.excerpt && (
                                <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                                  <HighlightedText html={item.excerpt} />
                                </p>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {data.articles.total > data.articles.items.length && (
                        <div className="px-4 pt-2">
                          <Link
                            href={`/blog?q=${encodeURIComponent(keyword)}`}
                            onClick={close}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            View all articles
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                  {data.recipes.items.length > 0 && (
                    <div className="py-2">
                      <SectionTitle>
                        Recipes ({data.recipes.total})
                      </SectionTitle>
                      <ul className="grid grid-cols-1 gap-1 px-2">
                        {data.recipes.items.map(item => (
                          <li key={item.id}>
                            <Link
                              href={`/recipes/${
                                item.categories?.[0]?.slug || 'all'
                              }/${item.slug}`}
                              onClick={close}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-surface"
                            >
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                                {item.thumbnail ? (
                                  <Image
                                    src={item.thumbnail}
                                    alt={item.title}
                                    fill
                                    unoptimized
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-ink-muted/30">
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink">
                                  {item.highlight?.title ? (
                                    <HighlightedText
                                      html={item.highlight.title}
                                    />
                                  ) : (
                                    item.title
                                  )}
                                </p>
                                {item.summary && (
                                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                                    {item.highlight?.summary ? (
                                      <HighlightedText
                                        html={item.highlight.summary}
                                      />
                                    ) : (
                                      item.summary
                                    )}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {data.recipes.total > data.recipes.items.length && (
                        <div className="px-4 pt-2">
                          <Link
                            href={`/recipes?q=${encodeURIComponent(keyword)}`}
                            onClick={close}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            View all recipes
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
