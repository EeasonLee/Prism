import type { Metadata } from 'next';
import { ArticleDetailPageView } from '@/app/_ui/ArticleDetailPageView';

export const metadata: Metadata = {
  title: '首屏速度不是玄学 | Yason_',
  description:
    '用关键渲染路径理解首屏速度、资源阻塞、Next.js 拆包、缓存、图片策略和性能预算的文章详情页。',
};

export default function PerformanceOptimizationArticlePage() {
  return (
    <main className="flex-1">
      <ArticleDetailPageView />
    </main>
  );
}
