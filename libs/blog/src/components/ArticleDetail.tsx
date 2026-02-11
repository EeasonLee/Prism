import { OptimizedImage } from '@prism/ui/components/OptimizedImage';
import type { ArticleDetail as ArticleDetailType } from '../api/types';

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
    <article className="min-w-0 max-w-full">
      {/* Header */}
      <header className="mb-6 md:mb-8">
        {category && (
          <div className="mb-3 md:mb-4">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
              {category.name}
            </span>
          </div>
        )}
        <h1 className="mb-3 break-words text-2xl font-bold leading-tight text-gray-900 md:mb-4 md:text-4xl lg:text-5xl">
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
        <div className="relative mb-6 aspect-video min-w-0 overflow-hidden rounded-lg bg-gray-100 md:mb-8">
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

      {/* Content: 防止移动端横向溢出，长单词换行，正文内图片/表格等不撑出视口 */}
      <div
        className="prose prose-lg max-w-none break-words overflow-x-hidden prose-headings:font-bold prose-headings:text-gray-900 prose-headings:break-words prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-pre:max-w-full prose-pre:overflow-x-auto prose-table:block prose-table:max-w-full prose-table:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
