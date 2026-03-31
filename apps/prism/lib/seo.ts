import type { ArticleDetail } from '@prism/blog';
import type { Metadata } from 'next';
import { env } from './env';
import type { Recipe } from '../app/recipes/types';
import { processImageUrl } from '@prism/shared';

const SITE_NAME = 'Joydeem';
const DEFAULT_LOCALE = 'en_US';
const BRAND_LOGO_URL =
  'https://www.joydeem.com/media/favicon/stores/14/joydeem_logo_html_2.png';

export function absoluteUrl(path: string): string {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

function normalizeText(value?: string | null): string | undefined {
  if (!value) return undefined;
  return (
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || undefined
  );
}

function truncate(
  value: string | undefined,
  maxLength = 160
): string | undefined {
  if (!value) return undefined;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function resolveImage(url?: string | null): string | undefined {
  const resolved = processImageUrl(url);
  return resolved ?? undefined;
}

function buildMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ?? BRAND_LOGO_URL;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type,
      images: [
        {
          url: ogImage,
          alt: title,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export function buildStaticMetadata({
  title,
  description,
  path,
  image,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
}): Metadata {
  return buildMetadata({
    title,
    description,
    path,
    image,
    keywords,
  });
}

export function buildRecipeMetadata(
  recipe: Recipe,
  categorySlug?: string
): Metadata {
  const description =
    truncate(
      normalizeText(recipe.description ?? recipe.summary ?? recipe.content) ??
        'Explore Joydeem recipes with step-by-step instructions, ingredients, and cooking tips.'
    ) ??
    'Explore Joydeem recipes with step-by-step instructions, ingredients, and cooking tips.';
  const canonicalCategory =
    recipe.categories?.[0]?.slug ?? categorySlug ?? 'all';
  const canonicalPath = `/recipes/${canonicalCategory}/${recipe.slug}`;
  const totalMinutes = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const timeLabel =
    totalMinutes > 0 ? ` Ready in ${totalMinutes} minutes.` : '';

  return buildMetadata({
    title: `${recipe.title} | Joydeem Recipes`,
    description: truncate(`${description}${timeLabel}`, 160) ?? description,
    path: canonicalPath,
    image: resolveImage(recipe.featuredImage?.url),
    type: 'article',
    publishedTime: recipe.createdAt,
    modifiedTime: recipe.updatedAt,
    keywords: [
      recipe.title,
      ...(recipe.categories?.map(category => category.name) ?? []),
      ...(recipe.tags?.map(tag => tag.name) ?? []),
    ],
  });
}

export function buildArticleMetadata(
  article: ArticleDetail,
  categorySlug?: string
): Metadata {
  const description =
    truncate(
      normalizeText(article.excerpt ?? article.content) ??
        'Read kitchen insights, product guides, and cooking inspiration from Joydeem.'
    ) ??
    'Read kitchen insights, product guides, and cooking inspiration from Joydeem.';
  const canonicalCategory =
    article.categories?.[0]?.slug ?? categorySlug ?? 'all';
  const canonicalPath = `/blog/${canonicalCategory}/${article.slug}`;

  return buildMetadata({
    title: `${article.title} | Joydeem Blog`,
    description,
    path: canonicalPath,
    image: resolveImage(article.featuredImage?.url),
    type: 'article',
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    keywords: [
      article.title,
      ...(article.categories?.map(category => category.name) ?? []),
      ...(article.tags?.map(tag => tag.name) ?? []),
    ],
  });
}

export function buildRecipeSchema(recipe: Recipe, categorySlug?: string) {
  const canonicalCategory =
    recipe.categories?.[0]?.slug ?? categorySlug ?? 'all';
  const url = absoluteUrl(`/recipes/${canonicalCategory}/${recipe.slug}`);
  const image = resolveImage(recipe.featuredImage?.url);
  const totalTimeMinutes = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description:
      normalizeText(recipe.description ?? recipe.summary ?? recipe.content) ??
      recipe.title,
    url,
    image: image ? [image] : undefined,
    recipeCategory: recipe.categories?.[0]?.name,
    recipeCuisine:
      recipe.filters?.find(filter => filter.type === 'cuisine')?.name ??
      undefined,
    keywords: recipe.tags?.map(tag => tag.name).join(', '),
    prepTime: recipe.prepTime ? `PT${recipe.prepTime}M` : undefined,
    cookTime: recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
    totalTime: totalTimeMinutes > 0 ? `PT${totalTimeMinutes}M` : undefined,
    recipeYield: recipe.servings ? `${recipe.servings} servings` : undefined,
    recipeIngredient: recipe.ingredients?.map(ingredient => {
      const parts = [
        ingredient.amount,
        ingredient.unit,
        ingredient.name,
        ingredient.notes,
      ];
      return parts.filter(Boolean).join(' ');
    }),
    recipeInstructions: recipe.instructions?.map(item => ({
      '@type': 'HowToStep',
      position: item.step,
      text: item.instruction,
      image: resolveImage(item.image?.url),
    })),
    nutrition: recipe.nutritionInfo
      ? {
          '@type': 'NutritionInformation',
          ...(recipe.nutritionInfo.calories
            ? { calories: `${recipe.nutritionInfo.calories} calories` }
            : {}),
          ...(recipe.nutritionInfo.protein
            ? { proteinContent: `${recipe.nutritionInfo.protein} g` }
            : {}),
          ...(recipe.nutritionInfo.carbs
            ? { carbohydrateContent: `${recipe.nutritionInfo.carbs} g` }
            : {}),
          ...(recipe.nutritionInfo.fat
            ? { fatContent: `${recipe.nutritionInfo.fat} g` }
            : {}),
          ...(recipe.nutritionInfo.fiber
            ? { fiberContent: `${recipe.nutritionInfo.fiber} g` }
            : {}),
          ...(recipe.nutritionInfo.sugar
            ? { sugarContent: `${recipe.nutritionInfo.sugar} g` }
            : {}),
        }
      : undefined,
    aggregateRating:
      typeof recipe.rating === 'number'
        ? {
            '@type': 'AggregateRating',
            ratingValue: recipe.rating,
            reviewCount:
              recipe.viewCount && recipe.viewCount > 0 ? recipe.viewCount : 1,
          }
        : undefined,
    author: recipe.author?.username
      ? {
          '@type': 'Person',
          name: recipe.author.username,
        }
      : {
          '@type': 'Organization',
          name: SITE_NAME,
        },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: BRAND_LOGO_URL,
      },
    },
    datePublished: recipe.createdAt,
    dateModified: recipe.updatedAt,
  };
}

export function buildArticleSchema(
  article: ArticleDetail,
  categorySlug?: string
) {
  const canonicalCategory =
    article.categories?.[0]?.slug ?? categorySlug ?? 'all';
  const url = absoluteUrl(`/blog/${canonicalCategory}/${article.slug}`);
  const image = resolveImage(article.featuredImage?.url);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: url,
    headline: article.title,
    description:
      normalizeText(article.excerpt ?? article.content) ?? article.title,
    image: image ? [image] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    articleSection: article.categories?.[0]?.name,
    keywords: article.tags?.map(tag => tag.name).join(', '),
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: BRAND_LOGO_URL,
      },
    },
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
