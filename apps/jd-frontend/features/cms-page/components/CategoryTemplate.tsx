import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { resolveImageUrl } from '@prism/shared';
import type { PageSection } from '../types';
import { categoryService } from '@/features/category';
import { ProductCard, productQueryFacade } from '@/features/product';

const PRODUCTS_PER_SECTION = 8;

interface MallCategorySection {
  id: number;
  name: string;
  slug?: string;
  magentoCategoryId?: number | null;
  description?: string | null;
  listImageUrl?: string | null;
  products: Awaited<
    ReturnType<typeof productQueryFacade.queryProducts>
  >['items'];
}

interface MallCategorySeed {
  id: number;
  label: string;
  slug: string;
  magentoCategoryId?: number;
  listImageUrl?: string | null;
}

interface MallPageData {
  bannerImageUrl: string | null;
  sections: MallCategorySection[];
}

function pickMallConfigFromSections(sections: PageSection[]): {
  bannerImageUrl: string | null;
  categorySeeds: MallCategorySeed[];
} {
  const heroSection = sections.find(
    section => section.__component === 'page.hero-banner'
  );
  const bannerImageUrl =
    heroSection &&
    'slides' in heroSection.props &&
    Array.isArray(heroSection.props.slides)
      ? heroSection.props.slides[0]?.image?.url ?? null
      : null;

  const categorySection = sections.find(
    section => section.__component === 'page.category-grid'
  );
  const categorySeeds =
    categorySection &&
    'categories' in categorySection.props &&
    Array.isArray(categorySection.props.categories)
      ? categorySection.props.categories
          .filter(
            category =>
              Number.isFinite(category.id) &&
              category.id > 0 &&
              typeof category.label === 'string' &&
              category.label.trim().length > 0
          )
          .map(category => ({
            id: category.id,
            label: category.label.trim(),
            slug: category.slug?.trim() ?? '',
            magentoCategoryId: category.magentoCategoryId,
          }))
      : [];

  return {
    bannerImageUrl,
    categorySeeds,
  };
}

async function getMallPageData(sections: PageSection[]): Promise<MallPageData> {
  const { bannerImageUrl, categorySeeds: rawCategorySeeds } =
    pickMallConfigFromSections(sections);
  const expandedSeedGroups = await Promise.all(
    rawCategorySeeds.map(async seed => {
      const seedSlug = seed.slug.trim();
      if (!seedSlug) {
        return [seed];
      }

      const categoryWithChildren =
        await categoryService.getStrapiCategoryBasicBySlug(seedSlug);
      const children = categoryWithChildren?.children ?? [];
      if (children.length === 0) {
        return [seed];
      }

      return children.map(child => ({
        id: child.id,
        label: child.name,
        slug: child.slug,
        listImageUrl: child.imageUrl ?? null,
      }));
    })
  );
  const categorySeeds = expandedSeedGroups.flat();
  const deduplicatedSeeds = Array.from(
    new Map(categorySeeds.map(seed => [seed.id, seed])).values()
  );
  const categoryIds = deduplicatedSeeds.map(category => category.id);
  const categoryRows = await categoryService.getStrapiCategoriesByIds(
    categoryIds
  );
  const categoryById = new Map(
    categoryRows.map(category => [category.id, category])
  );
  const categories = deduplicatedSeeds.map(seed => {
    const detail = categoryById.get(seed.id);
    return {
      id: seed.id,
      name: detail?.name ?? seed.label,
      slug: detail?.slug?.trim() || seed.slug || undefined,
      magentoCategoryId:
        detail?.magentoCategoryId ?? seed.magentoCategoryId ?? null,
      description: detail?.description ?? null,
      listImageUrl: detail?.listImageUrl ?? seed.listImageUrl ?? null,
    };
  });

  const sectionList = await Promise.all(
    categories.map(async category => {
      const hasMagentoCategoryId =
        typeof category.magentoCategoryId === 'number' &&
        category.magentoCategoryId > 0;

      try {
        const result = await productQueryFacade.queryProducts({
          ...(hasMagentoCategoryId
            ? { magentoCategoryId: category.magentoCategoryId }
            : category.slug?.trim()
            ? { strapiCategorySlug: category.slug.trim() }
            : { strapiCategoryId: category.id }),
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

  return {
    bannerImageUrl,
    sections: sectionList,
  };
}

function CategoryFilterItem({ section }: { section: MallCategorySection }) {
  const imageUrl =
    resolveImageUrl(section.listImageUrl) ?? section.listImageUrl;
  const content = (
    <>
      <div className="relative h-16 w-16 overflow-hidden rounded-full border border-line bg-bg-subtle sm:h-20 sm:w-20">
        {imageUrl ? (
          <OptimizedImage
            src={imageUrl}
            alt={section.name}
            fill
            maxDisplayWidth={80}
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

export async function CategoryTemplate({
  sections,
}: {
  sections: PageSection[];
}) {
  const { bannerImageUrl, sections: mallSections } = await getMallPageData(
    sections
  );

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <section className="overflow-hidden rounded-xl border border-line">
        <div className="relative aspect-[3/1] min-h-[180px] w-full bg-bg-subtle">
          {bannerImageUrl ? (
            <OptimizedImage
              src={bannerImageUrl}
              alt="Mall banner"
              fill
              maxDisplayWidth={1920}
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-ink-muted">
              Banner unavailable
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-5 text-lg font-semibold text-ink sm:text-xl">
          Shop by Category
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 sm:gap-6">
          {mallSections.map(section => (
            <CategoryFilterItem key={section.id} section={section} />
          ))}
        </div>
      </section>

      <div className="mt-10 space-y-12">
        {mallSections.map(section => (
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
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
