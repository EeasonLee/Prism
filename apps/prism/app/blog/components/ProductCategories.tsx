import Link from 'next/link';
import { OptimizedImage } from '@/components/OptimizedImage';
import type { CategoryDetail } from '@/lib/api/articles';
import { PageContainer } from '@/app/components/PageContainer';

interface ProductCategoriesProps {
  categories: CategoryDetail[];
  title?: string;
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
                return (
                  <Link
                    key={category.id}
                    href={`/blog/${category.slug}`}
                    className="group flex min-w-[160px] flex-col items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md lg:min-w-[180px]"
                  >
                    {/* 图标图片 */}
                    <div className="relative mb-3 h-24 w-24 overflow-hidden rounded-lg bg-gray-50 lg:h-28 lg:w-28">
                      <OptimizedImage
                        src={category.icon || null}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 160px, 180px"
                        preferredFormat="medium"
                      />
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
