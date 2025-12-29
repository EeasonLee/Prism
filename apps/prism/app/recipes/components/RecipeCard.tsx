import Link from 'next/link';
import { OptimizedImage } from '@/components/OptimizedImage';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const imageAlt = recipe.featuredImage?.alternativeText || recipe.title;

  // Get the first category as display category
  const category =
    recipe.categories?.[0]?.name || recipe.filters?.[0]?.name || 'RECIPE';

  // Get category slug for URL, fallback to 'recipe' if no category
  const categorySlug = recipe.categories?.[0]?.slug || 'recipe';
  // 优先使用 categories 构建 URL（包含分类的完整路径）
  // 如果 url 字段存在且包含分类路径（格式：/recipes/category/slug），则使用它
  // 否则使用 categories 构建 URL
  const hasCategoryInUrl =
    recipe.url && recipe.url.match(/^\/recipes\/[^/]+\/[^/]+$/);
  const targetHref: string =
    hasCategoryInUrl && recipe.url
      ? recipe.url
      : `/recipes/${categorySlug}/${recipe.slug}`;

  return (
    <Link
      href={targetHref as '/recipes' & string}
      className="group relative block overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-lg"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100">
        <OptimizedImage
          src={recipe.featuredImage || null}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Favorite icon */}
        {/* <span
          className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm"
          aria-hidden
        >
          <svg
            className="h-5 w-5 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </span> */}
      </div>

      {/* Content area */}
      <div className="p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {category}
        </p>
        <h3 className="text-base font-semibold leading-tight text-gray-900">
          {recipe.highlight?.title ? (
            <span
              dangerouslySetInnerHTML={{ __html: recipe.highlight.title }}
            />
          ) : (
            recipe.title
          )}
        </h3>
        {recipe.description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            {recipe.highlight?.summary ? (
              <span
                dangerouslySetInnerHTML={{ __html: recipe.highlight.summary }}
              />
            ) : (
              recipe.description
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
