import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users } from 'lucide-react';
import type { Recipe } from './mock-data';

const DIFFICULTY_COLORS: Record<Recipe['difficulty'], string> = {
  Easy: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  Hard: 'bg-red-100 text-red-700',
};

interface RecipesSectionProps {
  recipes: Recipe[];
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map(recipe => (
          <article
            key={recipe.id}
            className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-brand/30 hover:shadow-md"
          >
            {/* 图片 */}
            <div className="relative aspect-[3/2] overflow-hidden bg-surface">
              <Image
                src={recipe.image}
                alt={recipe.title}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition group-hover:scale-105"
              />
              {/* 难度 badge */}
              <span
                className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  DIFFICULTY_COLORS[recipe.difficulty]
                }`}
              >
                {recipe.difficulty}
              </span>
            </div>

            {/* 内容 */}
            <div className="p-4">
              <h3 className="mb-3 line-clamp-2 text-sm font-semibold leading-snug text-ink">
                {recipe.title}
              </h3>

              {/* 元信息行 */}
              <div className="mb-3 flex items-center gap-4 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {recipe.time}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {recipe.servings} servings
                </span>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-1.5">
                {recipe.tags.map(tag => (
                  <span
                    key={tag}
                    className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-muted ring-1 ring-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
