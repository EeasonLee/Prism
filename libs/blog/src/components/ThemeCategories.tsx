import { OptimizedImage } from '@prism/ui/components/OptimizedImage';
import { PageContainer } from '@prism/ui/components/PageContainer';
import Link from 'next/link';
import type { CategoryArticle, CategoryDetail } from '../api/types';

interface ThemeCategoriesProps {
  category: CategoryDetail;
}

function ArticleCard({
  article,
  categorySlug,
}: {
  article: CategoryArticle;
  categorySlug: string;
}) {
  const imageAlt = article.featuredImage?.alternativeText || article.title;

  return (
    <Link
      href={`/blog/${categorySlug}/${article.slug}`}
      className="group relative block overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <OptimizedImage
          src={
            article.featuredImage
              ? {
                  url: article.featuredImage.url,
                  alternativeText: article.featuredImage.alternativeText,
                  formats: article.featuredImage.formats,
                }
              : null
          }
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
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
  return (
    <div>
      {category.children?.map((childCategory, index) => {
        const articles = childCategory.articles || [];
        const gridColsClass = index === 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-5';

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
              <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${gridColsClass}`}
              >
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
