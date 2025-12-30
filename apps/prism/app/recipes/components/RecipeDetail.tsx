import Link from 'next/link';
import { OptimizedImage } from '@prism/ui/components/OptimizedImage';
import { PageContainer } from '@prism/ui/components/PageContainer';
import type { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';

interface RecipeDetailProps {
  recipe: Recipe;
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
  const imageAlt = recipe.featuredImage?.alternativeText || recipe.title;

  // Get the first category for breadcrumb
  const category = recipe.categories?.[0];
  const categoryId = category?.id;
  const categoryName = category?.name || 'Recipe';

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <PageContainer className="py-4">
          <nav
            className="flex items-center space-x-2 text-sm"
            aria-label="Breadcrumb"
          >
            <Link
              href="/recipes"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Recipes
            </Link>
            {category && (
              <>
                <span className="text-gray-400" aria-hidden="true">
                  &gt;
                </span>
                <Link
                  href={
                    categoryId
                      ? `/recipes?categoryId=${categoryId}`
                      : '/recipes'
                  }
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {categoryName}
                </Link>
              </>
            )}
            <span className="text-gray-400" aria-hidden="true">
              &gt;
            </span>
            <span className="text-gray-900 font-medium" aria-current="page">
              {recipe.title}
            </span>
          </nav>
        </PageContainer>
      </div>

      {/* Hero */}
      <PageContainer className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr,1fr] lg:items-start">
          {recipe.featuredImage && (
            <div className="relative aspect-[7/5] overflow-hidden rounded-xl border border-gray-100 shadow-sm">
              <OptimizedImage
                src={recipe.featuredImage}
                alt={imageAlt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
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

            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight text-gray-900">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="text-lg leading-relaxed text-gray-600">
                  {recipe.description}
                </p>
              )}
            </div>

            {/* 产品 */}
            {recipe.products && recipe.products.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-1xl font-bold text-gray-900">Tools</h3>
                <div className="flex flex-wrap gap-6">
                  {recipe.products.map(product => {
                    const productUrl = product.url || '#';

                    return (
                      <a
                        key={product.id}
                        href={productUrl}
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center transition-transform hover:scale-105"
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-100 shadow-sm ring-1 ring-gray-200 transition-shadow group-hover:ring-gray-300">
                          {product.image ? (
                            <OptimizedImage
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="66px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-2xl font-semibold text-gray-400">
                              {product.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* {product.shortDescription && (
                          <p className="mt-2 max-w-[96px] text-center text-xs text-gray-600 line-clamp-2">
                            {product.shortDescription}
                          </p>
                        )} */}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              {!!recipe.prepTime && (
                <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
                  <svg
                    className="h-5 w-5"
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
                  Prep: {formatTime(recipe.prepTime)}
                </div>
              )}
              {!!recipe.cookTime && (
                <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
                  <svg
                    className="h-5 w-5"
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
                  Cook: {formatTime(recipe.cookTime)}
                </div>
              )}
              {!!recipe.servings && (
                <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
                  <svg
                    className="h-5 w-5"
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
                  Serves: {recipe.servings}
                </div>
              )}
              {!!recipe.rating && (
                <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-amber-800">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {recipe.rating.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Body */}
      <PageContainer className="pb-12">
        <div className="grid gap-10 lg:grid-cols-[0.8fr,1.6fr]">
          {/* Left content - Ingredient Notes */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Ingredients
                </h2>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
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

            {recipe.ingredientsContent && (
              <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Ingredient Notes
                </h3>
                <div
                  className="recipe-content prose max-w-none text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline"
                  dangerouslySetInnerHTML={{
                    __html: recipe.ingredientsContent,
                  }}
                />
              </section>
            )}

            {recipe.nutritionInfo && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
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

            {recipe.filters && recipe.filters.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
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
          </aside>

          {/* Right content - Preparation */}
          <div className="space-y-10">
            {recipe.content && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Preparation
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

            {/* 推荐食谱列表 */}
            {recipe.relatedRecipes && recipe.relatedRecipes.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Recommended Recipes
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {recipe.relatedRecipes.map(relatedRecipe => (
                    <RecipeCard key={relatedRecipe.id} recipe={relatedRecipe} />
                  ))}
                </div>
              </section>
            )}

            {recipe.instructions && recipe.instructions.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Instructions
                </h2>
                <ol className="space-y-6">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                        {instruction.step || index + 1}
                      </div>
                      <div className="flex-1 space-y-4">
                        {instruction.image && (
                          <div className="relative aspect-video overflow-hidden rounded-lg">
                            <OptimizedImage
                              src={instruction.image}
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

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
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

            {recipe.author && (
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  Author
                </h3>
                <p className="text-sm text-gray-600">
                  {recipe.author.username}
                </p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
