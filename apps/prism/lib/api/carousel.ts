import { apiClient } from './client';

export interface CarouselSlide {
  id: number;
  image: {
    id: number;
    documentId: string;
    name: string;
    alternativeText: string | null;
    width: number;
    height: number;
    formats?: {
      large?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      small?: { url: string; width: number; height: number };
      thumbnail?: { url: string; width: number; height: number };
    };
    url: string;
  } | null;
  linkType: 'internal' | 'external';
  linkUrl: string | null;
  enabled: boolean;
}

export interface CarouselItemResponse {
  id: number;
  documentId: string;
  title: string;
  order: number;
  enabled: boolean;
  pageType: 'article' | 'recipe' | 'home';
  slides: CarouselSlide[];
}

export interface CarouselItemsResponse {
  data: CarouselItemResponse[];
}

export async function getCarouselItems(
  pageType: 'article' | 'recipe' | 'home' = 'article'
): Promise<CarouselItemsResponse> {
  const endpoint = `api/carousel-items?filters[pageType][$eq]=${pageType}`;

  return apiClient.get<CarouselItemsResponse>(endpoint, {
    next: {
      revalidate: 60,
    },
  });
}
