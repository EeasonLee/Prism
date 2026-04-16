import type { ProductVideoCard } from './product-page-types';
import { ProductVideosCarousel } from './ProductVideosCarousel';

interface ProductVideosSectionProps {
  videos: ProductVideoCard[];
}

export function ProductVideosSection({ videos }: ProductVideosSectionProps) {
  if (videos.length === 0) return null;

  return (
    <section
      aria-labelledby="product-videos-heading"
      className="py-12 lg:py-16"
    >
      <div className="mb-8 text-center">
        <h2
          id="product-videos-heading"
          className="heading-3 mx-auto max-w-3xl text-ink"
        >
          See what&apos;s cooking in the Joydeem kitchen. Find your next
          favorite.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl body-text text-ink-muted">
          See how home cooks are bringing Joydeem to life every day. Follow us
          on Instagram and tag your creations with #joydeemkitchen to be
          featured.
        </p>
      </div>
      <ProductVideosCarousel videos={videos} />
    </section>
  );
}
