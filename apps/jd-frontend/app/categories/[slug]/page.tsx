import { notFound } from 'next/navigation';
import { resolveCategoryBySlug } from '@/features/category';
import { CategoryPageContent } from './CategoryPageContent';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await resolveCategoryBySlug(slug).catch(() => null);
  if (!category) {
    notFound();
  }

  return <CategoryPageContent currentCategory={category} searchParams={sp} />;
}
