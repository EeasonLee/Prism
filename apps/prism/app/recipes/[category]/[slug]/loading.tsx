import { PageContainer } from '@prism/ui/components/PageContainer';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* 返回按钮骨架 */}
      <div className="border-b border-gray-200 bg-white">
        <PageContainer className="py-4">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
        </PageContainer>
      </div>

      <PageContainer className="py-8">
        {/* 标题骨架 */}
        <div className="mb-8">
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200"></div>
          <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-gray-200"></div>
          <div className="mb-6 h-6 w-full animate-pulse rounded bg-gray-200"></div>
          <div className="flex gap-6">
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>

        {/* 图片骨架 */}
        <div className="relative mb-8 aspect-video animate-pulse overflow-hidden rounded-lg bg-gray-200"></div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧内容骨架 */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="mb-4 h-8 w-24 animate-pulse rounded bg-gray-200"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-6 w-full animate-pulse rounded bg-gray-200"
                  ></div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-4 h-8 w-32 animate-pulse rounded bg-gray-200"></div>
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-24 w-full animate-pulse rounded bg-gray-200"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧边栏骨架 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
              <div className="h-32 animate-pulse rounded-lg bg-gray-200"></div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
