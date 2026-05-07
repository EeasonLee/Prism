import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { PdpRecipeCard } from '@/features/product';

interface RecipesSectionProps {
  recipes: PdpRecipeCard[];
}

export function RecipesSection({ recipes }: RecipesSectionProps) {
  if (recipes.length === 0) return null;

  return (
    <section aria-labelledby="recipes-heading" className="py-12 lg:py-16">
      <div className="mb-8 flex items-end justify-between">
        <h2 id="recipes-heading" className="heading-3 text-ink">
          Recipes to Try
        </h2>
        <Link
          href="/recipes"
          className="text-sm font-medium text-brand hover:underline"
        >
          View all recipes
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {recipes.map(recipe => {
          const safeDescription =
            recipe.description?.replace(/<[^>]+>/g, ' ').trim() ||
            'Discover this recipe and make it at home.';

          const content = (
            <>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
                {recipe.image ? (
                  <OptimizedImage
                    src={recipe.image}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : null}
              </div>

              <div className="pt-4">
                <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-snug text-ink">
                  {recipe.title}
                </h3>
                <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                  {safeDescription}
                </p>

                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {recipe.time}
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>{recipe.difficulty}</span>
                </div>
              </div>
            </>
          );

          return recipe.href ? (
            <Link
              key={recipe.id}
              href={recipe.href}
              className="group block transition hover:opacity-90"
            >
              {content}
            </Link>
          ) : (
            <article key={recipe.id} className="group">
              {content}
            </article>
          );
        })}
      </div>
    </section>
  );
}
