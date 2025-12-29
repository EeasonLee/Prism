import type { ArticleDetail as ArticleDetailType } from '@/lib/api/articles';
import { env } from '@/lib/env';
import Image from 'next/image';

interface ArticleDetailProps {
  article: ArticleDetailType;
}

// Utility function to get image URL
function getImageUrl(
  featuredImage: ArticleDetailType['featuredImage']
): string | null {
  if (!featuredImage) return null;

  // 优先使用 medium 格式，其次 small，最后使用原始图片
  const imageUrl =
    featuredImage.formats?.medium?.url ||
    featuredImage.formats?.small?.url ||
    featuredImage.url;

  if (!imageUrl) return null;

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // 处理 localhost URL
    if (
      imageUrl.includes('localhost:1337') ||
      imageUrl.includes('127.0.0.1:1337')
    ) {
      const apiBaseUrl =
        env.NEXT_PUBLIC_API_URL || 'http://192.168.50.244:1337';
      const baseUrl = apiBaseUrl.replace(/\/api$/, '').replace(/\/$/, '');
      const path = new URL(imageUrl).pathname;
      return `${baseUrl}${path}`;
    }
    return imageUrl;
  }

  // Extract base URL from API URL (remove /api suffix)
  const apiBaseUrl = env.NEXT_PUBLIC_API_URL
    ? env.NEXT_PUBLIC_API_URL.replace('/api', '')
    : 'http://192.168.50.244:1337';
  return `${apiBaseUrl}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
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
  const imageUrl = getImageUrl(article.featuredImage);
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
      {imageUrl && (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            unoptimized={
              imageUrl.startsWith('http://localhost') ||
              imageUrl.startsWith('http://192.168')
            }
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
