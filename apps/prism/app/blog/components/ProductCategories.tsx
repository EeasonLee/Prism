import Image from 'next/image';
import Link from 'next/link';
import { env } from '@/lib/env';
import type { CategoryDetail } from '@/lib/api/articles';
import { PageContainer } from '@/app/components/PageContainer';

interface ProductCategoriesProps {
  categories: CategoryDetail[];
  title?: string;
}

/**
 * 获取图片 URL（处理相对路径和完整 URL）
 */
function getImageUrl(url: string | undefined): string | null {
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

export function ProductCategories({
  categories,
  title = 'By Product',
}: ProductCategoriesProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section>
      <PageContainer>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">
            {title}
          </h2>
        </div>

        <div className="relative">
          {/* 横向滚动容器 */}
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-4 pr-4">
              {categories.map(category => {
                // 获取最佳尺寸的图标图片
                const iconUrl =
                  category.icon?.formats?.medium?.url ||
                  category.icon?.formats?.small?.url ||
                  category.icon?.formats?.thumbnail?.url ||
                  category.icon?.url ||
                  null;

                const imageUrl = getImageUrl(iconUrl || undefined);

                return (
                  <Link
                    key={category.id}
                    href={`/blog/${category.slug}`}
                    className="group flex min-w-[160px] flex-col items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md lg:min-w-[180px]"
                  >
                    {/* 图标图片 */}
                    <div className="relative mb-3 h-24 w-24 overflow-hidden rounded-lg bg-gray-50 lg:h-28 lg:w-28">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 160px, 180px"
                          unoptimized={
                            imageUrl.startsWith('http://localhost') ||
                            imageUrl.startsWith('http://192.168')
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <svg
                            className="h-8 w-8"
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

                    {/* 分类名称 */}
                    <h3 className="text-center text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                      {category.name}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 滚动提示 - 显示右侧还有内容 */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white via-white/90 to-transparent" />
        </div>
      </PageContainer>
    </section>
  );
}
