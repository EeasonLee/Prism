import type { ArticleListItem } from '@prism/blog';
import type { Recipe } from '../../../app/recipes/types';
import type { BlogPost } from '../../../app/products/[sku]/mock-data';
import { apiClient } from '../client';
import { env } from '../../env';

interface ArticleImageLike {
  url?: string | null;
  alternativeText?: string | null;
  formats?: {
    thumbnail?: { url?: string | null } | null;
    small?: { url?: string | null } | null;
    medium?: { url?: string | null } | null;
  } | null;
}

interface PdpArticleItem extends Omit<ArticleListItem, 'featuredImage'> {
  featuredImage?: string | ArticleImageLike | null;
}

interface StrapiImageLike {
  url?: string | null;
  alternativeText?: string | null;
  formats?: {
    thumbnail?: { url?: string | null } | null;
    small?: { url?: string | null } | null;
    medium?: { url?: string | null } | null;
  } | null;
}

interface StrapiListResponse<T> {
  data: T[];
}

interface PdpRecipeCard {
  id: number;
  title: string;
  image: string;
  href: string;
  time: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

function resolveStrapiUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (env.NEXT_PUBLIC_API_URL ?? 'http://localhost:1337').replace(
    /\/$/,
    ''
  );
  return `${base}${url}`;
}

function pickImageUrl(image: StrapiImageLike | null | undefined): string {
  return (
    resolveStrapiUrl(
      image?.formats?.medium?.url ??
        image?.formats?.small?.url ??
        image?.formats?.thumbnail?.url ??
        image?.url
    ) ?? ''
  );
}

function formatRecipeTime(recipe: Recipe): string {
  const totalMinutes = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  if (totalMinutes <= 0) return 'See recipe';
  return `${totalMinutes} min`;
}

function formatDifficulty(
  difficulty: Recipe['difficulty']
): 'Easy' | 'Medium' | 'Hard' {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'hard':
      return 'Hard';
    default:
      return 'Medium';
  }
}

function estimateReadTime(text: string | null | undefined): string {
  const plain = (text ?? '').replace(/<[^>]+>/g, ' ').trim();
  if (!plain) return '3 min read';
  const words = plain.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function formatArticleDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function mapRecipeToPdpCard(recipe: Recipe): PdpRecipeCard | null {
  if (!recipe.id || !recipe.title || !recipe.slug) return null;

  const categorySlug = recipe.categories?.[0]?.slug || 'recipe';
  const hasCategoryInUrl =
    recipe.url && recipe.url.match(/^\/recipes\/[^/]+\/[^/]+$/);

  return {
    id: recipe.id,
    title: recipe.title,
    image: pickImageUrl(recipe.featuredImage),
    href:
      hasCategoryInUrl && recipe.url
        ? recipe.url
        : `/recipes/${categorySlug}/${recipe.slug}`,
    time: formatRecipeTime(recipe),
    servings: recipe.servings ?? 1,
    difficulty: formatDifficulty(recipe.difficulty),
    tags: (recipe.tags ?? []).map(tag => tag.name).filter(Boolean),
  };
}

function mapArticleToPdpCard(article: PdpArticleItem): BlogPost | null {
  if (!article.id || !article.title || !article.slug) return null;

  const articleImage =
    typeof article.featuredImage === 'string'
      ? article.featuredImage
      : pickImageUrl(article.featuredImage);

  return {
    id: article.id,
    title: article.title,
    image: articleImage,
    date: formatArticleDate(article.publishedAt),
    excerpt: article.excerpt,
    href: `/blog/${article.categories[0]?.slug ?? 'articles'}/${article.slug}`,
    readTime: estimateReadTime(article.excerpt),
  };
}

export async function fetchPdpRecipesBySku(
  sku: string
): Promise<PdpRecipeCard[]> {
  const response = await apiClient.get<StrapiListResponse<Recipe>>(
    `api/recipes/by-product-sku/${encodeURIComponent(sku)}`,
    {
      next: { revalidate: 3600 },
    } as Parameters<typeof apiClient.get>[1]
  );

  return response.data
    .map(mapRecipeToPdpCard)
    .filter(Boolean) as PdpRecipeCard[];
}

export async function fetchPdpArticlesBySku(sku: string): Promise<BlogPost[]> {
  const response = await apiClient.get<StrapiListResponse<PdpArticleItem>>(
    `api/articles/by-product-sku/${encodeURIComponent(sku)}?locale=en`,
    {
      next: { revalidate: 3600 },
    } as Parameters<typeof apiClient.get>[1]
  );

  return response.data.map(mapArticleToPdpCard).filter(Boolean) as BlogPost[];
}

export type { PdpRecipeCard };
