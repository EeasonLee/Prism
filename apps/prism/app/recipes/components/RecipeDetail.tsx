import Image from 'next/image';
import Link from 'next/link';
import { env } from '../../../lib/env';
import type { Recipe } from '../types';

interface RecipeDetailProps {
  recipe: Recipe;
}

// Utility function to get image URL
function getImageUrl(url: string | undefined): string {
  if (!url) return '/placeholder-recipe.jpg';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Extract base URL from API URL (remove /api suffix)
  const apiBaseUrl = env.NEXT_PUBLIC_API_URL
    ? env.NEXT_PUBLIC_API_URL.replace('/api', '')
    : 'http://localhost:1337';
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

// Format time
function formatTime(minutes?: number): string {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Difficulty badge
function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;

  const colors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  const labels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        colors[difficulty as keyof typeof colors] || colors.medium
      }`}
    >
      {labels[difficulty as keyof typeof labels] || difficulty}
    </span>
  );
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const imageUrl = getImageUrl(recipe.featuredImage?.url);
  const imageAlt = recipe.featuredImage?.alternativeText || recipe.title;

  return (
    <div className="min-h-screen bg-white">
      {/* Back button */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 lg:px-8">
          <Link
            href="/recipes"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Recipes
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
        {/* Title and basic info */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {recipe.categories?.map(category => (
              <span
                key={category.id}
                className="text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {category.name}
              </span>
            ))}
            {recipe.difficulty && (
              <DifficultyBadge difficulty={recipe.difficulty} />
            )}
          </div>

          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            {recipe.title}
          </h1>

          {recipe.description && (
            <p className="mb-6 text-lg leading-relaxed text-gray-600">
              {recipe.description}
            </p>
          )}

          {/* Meta information */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            {recipe.prepTime && (
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Prep Time: {formatTime(recipe.prepTime)}
              </div>
            )}
            {recipe.cookTime && (
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Cook Time: {formatTime(recipe.cookTime)}
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Servings: {recipe.servings}
              </div>
            )}
            {recipe.rating && (
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Rating: {recipe.rating.toFixed(1)}
              </div>
            )}
          </div>
        </div>

        {/* Featured image */}
        {recipe.featuredImage && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left main content */}
          <div className="lg:col-span-2">
            {/* Ingredients list */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  Ingredients
                </h2>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-3 mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-600">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">
                        {ingredient.amount && ingredient.unit
                          ? `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
                          : ingredient.name}
                        {ingredient.notes && (
                          <span className="ml-2 text-sm text-gray-500">
                            ({ingredient.notes})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Recipe content (rich text) */}
            {recipe.content && (
              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  Recipe Details
                </h2>
                <div
                  className="recipe-content prose prose-lg max-w-none 
                    prose-headings:text-gray-900 prose-headings:font-bold
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-4
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-ul:text-gray-700 prose-ol:text-gray-700 prose-ul:my-4 prose-ol:my-4
                    prose-li:text-gray-700 prose-li:my-2
                    prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-img:w-full prose-img:h-auto
                    prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4
                    prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:my-4
                    prose-hr:my-8 prose-hr:border-gray-200"
                  dangerouslySetInnerHTML={{ __html: recipe.content }}
                />
              </section>
            )}

            {/* Instructions */}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  Instructions
                </h2>
                <ol className="space-y-6">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                        {instruction.step || index + 1}
                      </div>
                      <div className="flex-1">
                        {instruction.image && (
                          <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
                            <Image
                              src={getImageUrl(instruction.image.url)}
                              alt={
                                instruction.image.alternativeText ||
                                `Step ${index + 1}`
                              }
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 600px"
                            />
                          </div>
                        )}
                        <p className="leading-relaxed text-gray-700">
                          {instruction.instruction}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Nutrition info */}
              {recipe.nutritionInfo && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Nutrition
                  </h3>
                  <dl className="space-y-2 text-sm">
                    {recipe.nutritionInfo.calories && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Calories</dt>
                        <dd className="font-medium text-gray-900">
                          {recipe.nutritionInfo.calories} cal
                        </dd>
                      </div>
                    )}
                    {recipe.nutritionInfo.protein && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Protein</dt>
                        <dd className="font-medium text-gray-900">
                          {recipe.nutritionInfo.protein}g
                        </dd>
                      </div>
                    )}
                    {recipe.nutritionInfo.carbs && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Carbs</dt>
                        <dd className="font-medium text-gray-900">
                          {recipe.nutritionInfo.carbs}g
                        </dd>
                      </div>
                    )}
                    {recipe.nutritionInfo.fat && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Fat</dt>
                        <dd className="font-medium text-gray-900">
                          {recipe.nutritionInfo.fat}g
                        </dd>
                      </div>
                    )}
                    {recipe.nutritionInfo.fiber && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Fiber</dt>
                        <dd className="font-medium text-gray-900">
                          {recipe.nutritionInfo.fiber}g
                        </dd>
                      </div>
                    )}
                    {recipe.nutritionInfo.sugar && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Sugar</dt>
                        <dd className="font-medium text-gray-900">
                          {recipe.nutritionInfo.sugar}g
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter tags */}
              {recipe.filters && recipe.filters.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.filters.map(filter => (
                      <span
                        key={filter.id}
                        className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800"
                      >
                        {filter.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Author info */}
              {recipe.author && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Author
                  </h3>
                  <p className="text-sm text-gray-600">
                    {recipe.author.username}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
