import { notFound, redirect } from 'next/navigation';
import { getRecipeBySlug } from '../../../../lib/api/recipes';
import { RecipeDetail } from '../../components/RecipeDetail';

type RecipeDetailPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export const revalidate = 3600; // ISR: 重新验证时间 1 小时

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const resolvedParams = await params;
  const { category, slug } = resolvedParams;

  if (!slug) {
    notFound();
  }

  try {
    // 在服务端获取食谱数据
    const { data: recipe } = await getRecipeBySlug(slug);

    // 验证 URL 中的 category 是否与食谱的实际分类匹配
    const actualCategorySlug = recipe.categories?.[0]?.slug;
    if (actualCategorySlug && category !== actualCategorySlug) {
      // 重定向到正确的路由（服务端重定向）
      redirect(`/recipes/${actualCategorySlug}/${slug}`);
    }

    return <RecipeDetail recipe={recipe} />;
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
