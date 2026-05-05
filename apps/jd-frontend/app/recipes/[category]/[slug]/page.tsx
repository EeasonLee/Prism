import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { getRecipeBySlug } from '@/features/recipe/recipes.api';
import {
  buildBreadcrumbSchema,
  buildRecipeMetadata,
  buildRecipeSchema,
} from '@/shared/utils/seo';
import { RecipeDetail } from '@/features/recipe/RecipeDetail';

type RecipeDetailPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

// Numeric literal required by Next.js segment config; sync with REVALIDATE_SECONDS_CMS_ASSOCIATION in cache-policy.ts
export const revalidate = 3600; // ISR 兜底，主要依赖 On-Demand

const getRecipeDetail = cache(async (slug: string) => {
  const { data: recipe } = await getRecipeBySlug(slug, revalidate);
  return recipe;
});

export async function generateMetadata({
  params,
}: RecipeDetailPageProps): Promise<Metadata> {
  const { category, slug } = await params;

  try {
    const recipe = await getRecipeDetail(slug);
    return buildRecipeMetadata(recipe, category);
  } catch {
    return {
      title: 'Recipe Not Found | Joydeem Recipes',
      description:
        'Explore Joydeem recipes with step-by-step instructions and cooking tips.',
      alternates: { canonical: `/recipes/${category}/${slug}` },
    };
  }
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const resolvedParams = await params;
  const { category, slug } = resolvedParams;

  if (!slug) {
    notFound();
  }

  try {
    // 在服务端获取食谱数据（与路由 revalidate 一致，保证 Data Cache 生效）
    const recipe = await getRecipeDetail(slug);

    // 验证 URL 中的 category 是否与食谱的实际分类匹配
    const primaryCategory = recipe.categories?.[0];
    const actualCategorySlug = primaryCategory?.slug;
    if (actualCategorySlug && category !== actualCategorySlug) {
      // 重定向到正确的路由（服务端重定向）
      redirect(`/recipes/${actualCategorySlug}/${slug}`);
    }

    const canonicalCategory = actualCategorySlug ?? category;
    const breadcrumbSchema = buildBreadcrumbSchema([
      { name: 'Recipes', path: '/recipes' },
      ...(primaryCategory
        ? [
            {
              name: primaryCategory.name,
              path: `/recipes/${primaryCategory.slug}`,
            },
          ]
        : []),
      { name: recipe.title, path: `/recipes/${canonicalCategory}/${slug}` },
    ]);
    const recipeSchema = buildRecipeSchema(recipe, canonicalCategory);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([breadcrumbSchema, recipeSchema]),
          }}
        />
        <RecipeDetail recipe={recipe} />
      </>
    );
  } catch (error) {
    // 处理错误
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 如果是 404 错误，显示 404 页面
    if (
      errorMessage.includes('404') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('Recipe not found') ||
      errorMessage.includes('NOT_FOUND')
    ) {
      notFound();
    }

    // 其他错误抛出，由 error.tsx 处理
    throw error;
  }
}
