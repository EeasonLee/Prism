import { getPageBySlug } from '@/lib/api/cms-pages';
import { renderSections } from '../components/sections/blockMap';
import type { PageSection } from '@/lib/api/cms-page.types';

export const revalidate = 60;

export async function generateMetadata() {
  const page = await getPageBySlug('deal');
  if (page?.seo) {
    return {
      title: page.seo.title,
      description: page.seo.description,
    };
  }
  return {
    title: 'Deals - Joydeem',
    description: 'Discover amazing deals and special offers at Joydeem.',
  };
}

/**
 * Default fallback sections for /deal before CMS configuration.
 * Replace images and category names with real assets after Strapi setup.
 */
const fallbackSections: PageSection[] = [
  {
    __component: 'page.deal-banner',
    id: 1,
    props: {
      slides: [
        {
          id: 1,
          image: {
            id: 1,
            documentId: '',
            url: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1600&q=80',
            alternativeText: 'Deals Banner',
            width: 1600,
            height: 900,
          },
          title: 'Summer Deals',
          subtitle: 'Up to 50% off on selected categories',
          ctaText: 'Shop Now',
          ctaLink: '/shop',
          theme: 'dark',
        },
      ],
      showArrows: true,
      showDots: true,
    },
  },
  {
    __component: 'page.deal-category-nav',
    id: 2,
    props: {
      title: 'Shop by Category',
      items: [
        {
          id: 1,
          categoryUrlKey: 'kitchen-appliances',
          label: 'Kitchen Appliances',
          image: {
            id: 1,
            documentId: '',
            url: '/images/category-kitchen.jpg',
            alternativeText: 'Kitchen Appliances',
            width: 200,
            height: 200,
          },
          link: '/kitchen-appliances',
        },
        {
          id: 2,
          categoryUrlKey: 'blenders',
          label: 'Blenders',
          image: {
            id: 2,
            documentId: '',
            url: 'https://images.unsplash.com/photo-1570222094114-28a9d88a65e2?auto=format&fit=crop&w=200&q=80',
            alternativeText: 'Blenders',
            width: 200,
            height: 200,
          },
          link: '/blenders',
        },
        {
          id: 3,
          categoryUrlKey: 'hot-sellers',
          label: 'Hot Sellers',
          image: {
            id: 3,
            documentId: '',
            url: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=200&q=80',
            alternativeText: 'Hot Sellers',
            width: 200,
            height: 200,
          },
          link: '/hot-sellers',
        },
        {
          id: 4,
          categoryUrlKey: 'new-arrivals',
          label: 'New Arrivals',
          image: {
            id: 4,
            documentId: '',
            url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80',
            alternativeText: 'New Arrivals',
            width: 200,
            height: 200,
          },
          link: '/new-arrivals',
        },
      ],
    },
  },
  {
    __component: 'page.deal-product-blocks',
    id: 3,
    props: {
      blocks: [
        {
          id: 1,
          categoryName: 'Kitchen appliances',
          categoryUrlKey: 'kitchen-appliances',
          categoryLink: '/kitchen-appliances',
          productSkus: [],
          layout: 'grid-4',
        },
        {
          id: 2,
          categoryName: 'Hot Sellers',
          categoryUrlKey: 'hot-sellers',
          categoryLink: '/hot-sellers',
          productSkus: [],
          layout: 'grid-4',
        },
        {
          id: 3,
          categoryName: 'New Arrivals',
          categoryUrlKey: 'new-arrivals',
          categoryLink: '/new-arrivals',
          productSkus: [],
          layout: 'grid-4',
        },
      ],
    },
  },
];

export default async function DealPage() {
  const page = await getPageBySlug('deal');
  const sections =
    page && page.sections.length > 0 ? page.sections : fallbackSections;

  return (
    <div className="grain-overlay">
      <main className="relative pb-[calc(var(--mobile-tabbar-height)+var(--mobile-safe-area-bottom)+2rem)]">
        {renderSections(sections)}
      </main>
    </div>
  );
}
