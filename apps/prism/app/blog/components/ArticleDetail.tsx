import type { ArticleDetail as ArticleDetailType } from '@/lib/api/articles';
import { OptimizedImage } from '@/components/OptimizedImage';

interface ArticleDetailProps {
  article: ArticleDetailType;
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function ArticleDetail({ article }: ArticleDetailProps) {
  const imageAlt = article.featuredImage?.alternativeText || article.title;

  // Get the first category
  const category = article.categories?.[0];

  return (
    <article className="mx-auto max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        {category && (
          <div className="mb-4">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
              {category.name}
            </span>
          </div>
        )}
        <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900 lg:text-5xl">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <time dateTime={article.publishedAt}>
            {formatDate(article.publishedAt)}
          </time>
          {article.viewCount > 0 && (
            <span>{article.viewCount.toLocaleString()} views</span>
          )}
        </div>
      </header>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-lg bg-gray-100">
          <OptimizedImage
            src={article.featuredImage}
            alt={imageAlt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            preferredFormat="medium"
          />
        </div>
      )}

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {article.tags.map(tag => (
            <span
              key={tag.id}
              className="inline-block rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
