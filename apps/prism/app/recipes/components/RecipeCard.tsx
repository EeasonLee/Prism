import Image from 'next/image';
import Link from 'next/link';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  // Get image URL (handle relative and absolute paths)
  const getImageUrl = (url: string | undefined): string => {
    if (!url) return '/placeholder-recipe.jpg';
    // If it's a full URL, return directly
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative path, concatenate with API base URL
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
    return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const imageAlt = recipe.featuredImage?.alternativeText || recipe.title;
  const imageUrl = getImageUrl(recipe.featuredImage?.url);

  // Get the first category as display category
  const category =
    recipe.categories?.[0]?.name || recipe.filters?.[0]?.name || 'RECIPE';

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group relative block overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-lg"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Favorite icon */}
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            // TODO: Implement favorite functionality
          }}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm transition-all hover:bg-white hover:shadow-md"
          aria-label="Add to favorites"
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
        </button>
      </div>

      {/* Content area */}
      <div className="p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {category}
        </p>
        <h3 className="text-base font-semibold leading-tight text-gray-900">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            {recipe.description}
          </p>
        )}
      </div>
    </Link>
  );
}
