'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getRecipeBySlug } from '../../../../lib/api/recipes';
import { RecipeDetail } from '../../components/RecipeDetail';
import type { Recipe } from '../../types';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const category = params?.category as string;
  const slug = params?.slug as string;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setError(new Error('Invalid slug'));
      setLoading(false);
      return;
    }

    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getRecipeBySlug(slug);
        setRecipe(data);

        // 验证 URL 中的 category 是否与食谱的实际分类匹配
        const actualCategorySlug = data.categories?.[0]?.slug;
        if (actualCategorySlug && category !== actualCategorySlug) {
          // 重定向到正确的路由
          router.replace(`/recipes/${actualCategorySlug}/${slug}`);
          return;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        // If it's a 404 error, show 404 page
        if (
          error.message.includes('404') ||
          error.message.includes('not found') ||
          error.message.includes('Recipe not found')
        ) {
          notFound();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [slug, category, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-gray-600"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Error</h1>
          <p className="mt-4 text-lg text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    notFound();
  }

  return <RecipeDetail recipe={recipe} />;
}
