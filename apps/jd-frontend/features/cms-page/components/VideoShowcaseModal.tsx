'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { OptimizedImage, Skeleton } from '@prism/ui';
import { formatPrice } from '@prism/shared';
import type { ProductCardItem } from '@/features/product';
import type { VideoItem } from '../types';

interface VideoShowcaseModalProps {
  video: VideoItem;
  open: boolean;
  onClose: () => void;
}

export function VideoShowcaseModal({
  video,
  open,
  onClose,
}: VideoShowcaseModalProps) {
  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 入场动画 + body 滚动锁定
  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // 懒加载商品数据（通过服务端 API 代理查 Meilisearch）
  useEffect(() => {
    if (!open || video.productSkus.length === 0) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch('/api/products/by-skus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skus: video.productSkus }),
    })
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: { message?: string } })?.error?.message ??
              `Request failed: ${res.status}`
          );
        }
        const body = (await res.json()) as {
          success: boolean;
          data: ProductCardItem[];
        };
        if (!body.success || !Array.isArray(body.data)) {
          throw new Error('Invalid response');
        }
        return body.data;
      })
      .then(items => {
        if (!cancelled) {
          setProducts(items);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load products'
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, video.productSkus]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 transition-opacity duration-300 ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleOverlayClick}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl lg:flex-row">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 z-10 rounded-full bg-ink/20 p-1.5 text-white transition hover:bg-ink/40"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 视频区域 */}
        <div className="relative flex-shrink-0 bg-black lg:w-[42%]">
          <video
            src={video.videoUrl}
            poster={video.thumbnail?.url}
            controls
            muted
            playsInline
            className="aspect-[9/16] max-h-[40vh] w-full object-contain lg:aspect-video lg:max-h-[70vh]"
            aria-label={video.title}
          />
          {video.caption && (
            <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 caption text-white">
              {video.caption}
            </p>
          )}
        </div>

        {/* 商品列表区域 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 lg:w-[58%]">
          <h3 className="heading-4 text-ink">{video.title}</h3>

          {/* 加载态 */}
          {isLoading && (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-[72px] w-[72px] flex-shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 错误态 */}
          {!isLoading && error && (
            <p className="mt-4 body-text text-ink-muted">{error}</p>
          )}

          {/* 空商品 */}
          {!isLoading && !error && products.length === 0 && (
            <p className="mt-4 body-text text-ink-muted">
              No products available for this video
            </p>
          )}

          {/* 商品列表 */}
          {!isLoading && products.length > 0 && (
            <div className="mt-4 space-y-3">
              {products.map(product => (
                <VideoProductCard key={product.sku} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Modal 内使用的紧凑商品卡片 */
function VideoProductCard({ product }: { product: ProductCardItem }) {
  const href = `/products/${product.urlKey ?? product.sku}`;
  const hasDiscount =
    product.originalPrice != null &&
    product.price.value != null &&
    product.originalPrice > product.price.value;

  return (
    <Link
      href={href}
      className="flex gap-3 rounded-lg border border-border p-3 transition hover:bg-surface"
    >
      {/* 商品图片 */}
      <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg bg-surface">
        {product.image ? (
          <OptimizedImage
            src={product.image}
            alt={product.displayName}
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted">
            <span className="caption">No image</span>
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="min-w-0 flex-1">
        <h4 className="body-text line-clamp-2 font-medium text-ink">
          {product.displayName}
        </h4>
        {product.shortDescription && (
          <p className="mt-0.5 line-clamp-1 caption text-ink-muted">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="body-text font-semibold text-ink">
            {formatPrice(product.price.value ?? 0, product.price.currency)}
          </span>
          {hasDiscount && (
            <span className="caption text-ink-muted line-through">
              {formatPrice(product.originalPrice ?? 0, product.price.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
