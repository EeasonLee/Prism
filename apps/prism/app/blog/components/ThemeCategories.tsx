import Image from 'next/image';
import Link from 'next/link';
import { env } from '@/lib/env';
import { PageContainer } from '@/app/components/PageContainer';
import type { CategoryDetail, CategoryArticle } from '@/lib/api/articles';

interface ThemeCategoriesProps {
  category: CategoryDetail;
}

/**
 * 获取图片 URL（处理相对路径和完整 URL）
 */
function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 如果包含 localhost，替换为正确的 IP
    if (url.includes('localhost:1337') || url.includes('127.0.0.1:1337')) {
      const apiBaseUrl =
        env.NEXT_PUBLIC_API_URL || 'http://192.168.50.244:1337';
      const baseUrl = apiBaseUrl.replace(/\/api$/, '').replace(/\/$/, '');
      const urlObj = new URL(url);
      return `${baseUrl}${urlObj.pathname}${urlObj.search}`;
    }
    return url;
  }
  const apiBaseUrl = env.NEXT_PUBLIC_API_URL || 'http://192.168.50.244:1337';
  const baseUrl = apiBaseUrl.replace(/\/api$/, '').replace(/\/$/, '');
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

function ArticleCard({
  article,
  categorySlug,
}: {
  article: CategoryArticle;
  categorySlug: string;
}) {
  const imageUrl = article.featuredImage
    ? getImageUrl(article.featuredImage.url)
    : null;
  const imageAlt = article.featuredImage?.alternativeText || article.title;

  return (
    <Link
      href={`/blog/${categorySlug}/${article.slug}`}
      className="group relative block overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={
              imageUrl.startsWith('http://localhost') ||
              imageUrl.startsWith('http://192.168')
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-tight text-gray-900 transition-colors group-hover:text-blue-600">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="line-clamp-2 text-sm text-gray-600">
            {article.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

export function ThemeCategories({ category }: ThemeCategoriesProps) {
  if (!category.children || category.children.length === 0) {
    return null;
  }

  return (
    <div>
      {category.children.map(childCategory => {
        const articles = childCategory.articles || [];
        if (articles.length === 0) {
          return null;
        }

        return (
          <section key={childCategory.id} className="mb-12 last:mb-0">
            <PageContainer>
              {/* Section Header */}
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">
                  {childCategory.name}
                </h2>
                <Link
                  href={`/blog/${childCategory.slug}`}
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
                >
                  Browse All →
                </Link>
              </div>

              {/* Articles Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    categorySlug={childCategory.slug}
                  />
                ))}
              </div>
            </PageContainer>
          </section>
        );
      })}
    </div>
  );
}
