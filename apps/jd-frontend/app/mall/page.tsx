import Image from 'next/image';
import Link from 'next/link';
import { processImageUrl, shouldDisableImageOptimization } from '@prism/shared';
import { categoryService } from '@/lib/services/category.service';
import { ProductCard } from '../shop/components/ProductCard';
import { searchProducts } from '../shop/lib/meilisearch';

const MALL_BANNER_IMAGE_URL =
  'https://d2s2mafqv46idp.cloudfront.net/joydeem/media/pages/1_b5c7a96e0a.png';
const FIXED_CATEGORY_IDS = [15, 4, 87, 23, 88] as const;
const PRODUCTS_PER_SECTION = 8;

export const metadata = {
  title: 'Mall - Joydeem',
  description: 'Browse categories and products in the Joydeem mall.',
};

interface MallCategorySection {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  listImageUrl?: string | null;
  products: Awaited<ReturnType<typeof searchProducts>>['items'];
}

async function getMallCategorySections(): Promise<MallCategorySection[]> {
  const categories = await categoryService.getStrapiCategoriesByIds([
    ...FIXED_CATEGORY_IDS,
  ]);

  const sectionList = await Promise.all(
    categories.map(async category => {
      const searchCategoryId =
        typeof category.magentoCategoryId === 'number' &&
        category.magentoCategoryId > 0
          ? category.magentoCategoryId
          : category.id;

      try {
        const result = await searchProducts({
          categoryId: searchCategoryId,
          page: 1,
          pageSize: PRODUCTS_PER_SECTION,
        });

        return {
          ...category,
          products: result.items,
        };
      } catch {
        return {
          ...category,
          products: [],
        };
      }
    })
  );

  return sectionList;
}

function CategoryFilterItem({ section }: { section: MallCategorySection }) {
  const imageUrl =
    processImageUrl(section.listImageUrl) ?? section.listImageUrl;
  const content = (
    <>
      <div className="relative h-16 w-16 overflow-hidden rounded-full border border-line bg-bg-subtle sm:h-20 sm:w-20">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={section.name}
            fill
            unoptimized={shouldDisableImageOptimization(imageUrl)}
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-muted">
            N/A
          </div>
        )}
      </div>
      <span className="max-w-[88px] text-center text-xs font-medium text-ink sm:max-w-[108px] sm:text-sm">
        {section.name}
      </span>
    </>
  );

  return (
    <Link
      href={`#mall-category-${section.id}`}
      className="flex shrink-0 flex-col items-center gap-2 transition hover:opacity-85"
    >
      {content}
    </Link>
  );
}

export default async function MallPage() {
  const sections = await getMallCategorySections();

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <section className="overflow-hidden rounded-xl border border-line">
        <div className="relative aspect-[3/1] min-h-[180px] w-full bg-bg-subtle">
          <Image
            src={MALL_BANNER_IMAGE_URL}
            alt="Mall banner"
            fill
            unoptimized={shouldDisableImageOptimization(MALL_BANNER_IMAGE_URL)}
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-5 text-lg font-semibold text-ink sm:text-xl">
          Shop by Category
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 sm:gap-6">
          {sections.map(section => (
            <CategoryFilterItem key={section.id} section={section} />
          ))}
        </div>
      </section>

      <div className="mt-10 space-y-12">
        {sections.map(section => (
          <section
            key={`section-${section.id}`}
            id={`mall-category-${section.id}`}
            className="scroll-mt-24"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-ink sm:text-2xl">
                  {section.name}
                </h2>
                {section.description?.trim() ? (
                  <p className="max-w-3xl text-sm text-ink-muted sm:text-base">
                    {section.description.trim()}
                  </p>
                ) : null}
              </div>

              {section.slug ? (
                <Link
                  href={`/categories/${section.slug}`}
                  className="shrink-0 text-sm font-medium text-ink-muted transition hover:text-ink"
                >
                  View more
                </Link>
              ) : null}
            </div>

            {section.products.length > 0 ? (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {section.products.map(product => (
                  <li key={`${section.id}-${product.sku}`}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-muted">
                No products found in this category.
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
