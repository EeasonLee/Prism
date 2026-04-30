import { notFound } from 'next/navigation';
import { resolveCategoryBySlug } from '@/lib/api/bff/category/list';
import { CategoryPageContent } from '../components/CategoryPageContent';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  console.log('slug', slug);

  const category = await resolveCategoryBySlug(slug).catch(() => null);
  console.log('category', category);
  if (!category) {
    notFound();
  }

  return <CategoryPageContent currentCategory={category} searchParams={sp} />;
}
