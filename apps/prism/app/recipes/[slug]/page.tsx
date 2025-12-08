'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getRecipeBySlug } from '../../../lib/api/recipes';
import { RecipeDetail } from '../components/RecipeDetail';
import type { Recipe } from '../types';

export default function RecipeDetailPage() {
  const params = useParams();
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
  }, [slug]);

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
