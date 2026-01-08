import { OptimizedImage } from '@prism/ui/components/OptimizedImage';
import type { Route } from 'next';
import Link from 'next/link';
import type { ArticleDetail } from '../api/types';

interface ArticleSidebarProps {
  article: ArticleDetail;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function ArticleSidebar({ article }: ArticleSidebarProps) {
  const hasProducts = article.products && article.products.length > 0;
  const hasRelatedArticles =
    article.relatedArticles &&
    Array.isArray(article.relatedArticles) &&
    article.relatedArticles.length > 0;

  // 如果没有产品和相关文章，不显示侧边栏
  if (!hasProducts && !hasRelatedArticles) {
    return null;
  }

  return (
    <aside className="sticky top-8 h-fit space-y-8">
      {/* 关联产品 */}
      {hasProducts && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">
            Related Products
          </h3>
          <div className="space-y-4">
            {(article.products || []).map(product => {
              // 优先使用外部链接，否则使用内部链接
              const productUrl =
                product.url ||
                (product.slug ? `/products/${product.slug}` : '#');
              const isExternalLink = !!product.url;
              const productImage = product.image || '';

              return (
                <a
                  key={product.id}
                  href={productUrl}
                  target={isExternalLink ? '_blank' : undefined}
                  rel={isExternalLink ? 'noopener noreferrer' : undefined}
                  className="group block transition-transform hover:scale-[1.02]"
                >
                  <div className="flex gap-4 rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-300 hover:bg-gray-50">
                    {/* 产品图片 */}
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {productImage ? (
                        <OptimizedImage
                          src={productImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-lg font-semibold text-gray-400">
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* 产品信息 */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                        {product.name}
                      </h4>
                      {(product.sku || product.shortDescription) && (
                        <p className="line-clamp-1 text-xs text-gray-600">
                          {product.sku
                            ? `SKU: ${product.sku}`
                            : product.shortDescription}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {product.price !== undefined &&
                          product.price !== null && (
                            <span className="text-sm font-bold text-gray-900">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* 相关文章 */}
      {hasRelatedArticles && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">
            Related Articles
          </h3>
          <div className="space-y-4">
            {(article.relatedArticles as ArticleDetail[]).map(
              relatedArticle => {
                // 获取第一个分类用于构建链接
                const category = relatedArticle.categories?.[0];
                const articleUrl = category
                  ? `/blog/${category.slug}/${relatedArticle.slug}`
                  : `/blog/all/${relatedArticle.slug}`;

                // 获取文章图片
                // featuredImage 可能是对象（包含 url）或字符串
                let articleImage = '';
                if (relatedArticle.featuredImage) {
                  if (typeof relatedArticle.featuredImage === 'string') {
                    articleImage = relatedArticle.featuredImage;
                  } else if (relatedArticle.featuredImage.url) {
                    articleImage = relatedArticle.featuredImage.url;
                  } else if (
                    relatedArticle.featuredImage.formats?.thumbnail?.url
                  ) {
                    articleImage =
                      relatedArticle.featuredImage.formats.thumbnail.url;
                  }
                }

                return (
                  <Link
                    key={relatedArticle.id}
                    href={articleUrl as Route}
                    className="group block transition-transform hover:scale-[1.02]"
                  >
                    <div className="flex gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-300 hover:bg-gray-50">
                      {/* 文章缩略图 */}
                      {articleImage && (
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <OptimizedImage
                            src={articleImage}
                            alt={relatedArticle.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}

                      {/* 文章信息 */}
                      <div className="min-w-0 flex-1">
                        <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                          {relatedArticle.title}
                        </h4>
                        {relatedArticle.excerpt && (
                          <p className="mb-2 line-clamp-2 text-xs text-gray-600">
                            {relatedArticle.excerpt}
                          </p>
                        )}
                        <time
                          dateTime={relatedArticle.publishedAt}
                          className="text-xs text-gray-500"
                        >
                          {formatDate(relatedArticle.publishedAt)}
                        </time>
                      </div>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
