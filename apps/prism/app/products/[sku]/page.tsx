import Image from 'next/image';
import { notFound } from 'next/navigation';
import { fetchProductBySku } from '../../../lib/api/magento/catalog';
import { ProductDetailClient } from './ProductDetailClient';

interface Props {
  params: Promise<{ sku: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  simple: 'Simple',
  configurable: 'Configurable',
  bundle: 'Bundle',
  grouped: 'Grouped',
  virtual: 'Virtual',
};

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function StarRating({
  percentage,
  count,
}: {
  percentage: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* 用叠层 + overflow hidden 实现精确百分比填充 */}
      <div className="relative flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className="h-4 w-4 text-ink-muted/25"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d={STAR_PATH} />
          </svg>
        ))}
        <div
          className="absolute inset-0 flex gap-0.5 overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className="h-4 w-4 shrink-0 text-amber-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d={STAR_PATH} />
            </svg>
          ))}
        </div>
      </div>
      <span
        className="text-sm text-ink-muted"
        aria-label={`${(percentage / 20).toFixed(
          1
        )} out of 5, ${count} reviews`}
      >
        {(percentage / 20).toFixed(1)} ({count}{' '}
        {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { sku } = await params;
  const product = await fetchProductBySku(decodeURIComponent(sku)).catch(
    () => null
  );
  return {
    title: product ? `${product.name} - Joydeem` : 'Product - Joydeem',
    description: product?.name,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { sku } = await params;
  const product = await fetchProductBySku(decodeURIComponent(sku)).catch(
    () => null
  );

  if (!product) notFound();

  // media_gallery 优先，回退到旧字段
  const galleryImages =
    product.media_gallery?.filter(e => e.media_type === 'image') ??
    product.media_gallery_entries
      ?.filter(e => !e.disabled)
      .map(e => ({
        url: e.url,
        label: e.label,
        position: e.position,
        media_type: e.media_type,
      })) ??
    [];

  const mainImage =
    galleryImages[0]?.url ?? product.image_url ?? product.thumbnail_url;

  const hasDiscount =
    product.special_price != null && product.special_price < product.price;

  const typeLabel = TYPE_LABEL[product.type_id] ?? product.type_id;

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      {/* 面包屑 */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-2 text-sm text-ink-muted"
      >
        <a href="/shop" className="transition hover:text-ink">
          Shop
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* 左列：图片 */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-6"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-muted/30">
                <svg
                  className="h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* 缩略图走廊 */}
          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {galleryImages.slice(0, 6).map((entry, idx) => (
                <div
                  key={idx}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface"
                >
                  <Image
                    src={entry.url}
                    alt={entry.label ?? product.name}
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右列：商品信息 */}
        <div className="flex flex-col">
          {/* SKU + 类型 */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              SKU: {product.sku}
            </span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink-muted ring-1 ring-border">
              {typeLabel}
            </span>
          </div>

          <h1 className="mb-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {product.name}
          </h1>

          {/* 评分 */}
          {(product.rating_percentage ?? 0) > 0 && (
            <div className="mb-4">
              <StarRating
                percentage={product.rating_percentage ?? 0}
                count={product.review_count ?? 0}
              />
            </div>
          )}

          {/* 库存状态 */}
          <div className="mb-4">
            {product.is_in_stock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                In Stock
                {product.stock_qty != null && (
                  <span className="font-normal text-ink-muted">
                    ({product.stock_qty} available)
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Out of Stock
              </span>
            )}
          </div>

          {/* 价格 */}
          <div className="mb-6 flex items-baseline gap-3">
            {product.special_price != null && (
              <span className="text-2xl font-bold text-ink">
                ${product.special_price.toFixed(2)}
              </span>
            )}
            {product.price > 0 && (
              <span
                className={
                  hasDiscount
                    ? 'text-base text-ink-muted line-through'
                    : 'text-2xl font-bold text-ink'
                }
              >
                ${product.price.toFixed(2)}
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                Save $
                {(product.price - (product.special_price ?? 0)).toFixed(2)}
              </span>
            )}
          </div>

          {/* 属性选择 + 加购（Client Component） */}
          <ProductDetailClient product={product} />

          {/* 商品描述 */}
          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
                Description
              </h2>
              <div
                className="prose prose-sm max-w-none text-ink [&_li]:my-0.5 [&_ul]:pl-4"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
