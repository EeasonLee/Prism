import type { Metadata } from 'next';
import { SearchResultsPageView } from '@/app/_ui/SearchResultsPageView';

export const metadata: Metadata = {
  title: '搜索结果 | Yason_',
  description:
    'Yason_ 个人站的系统检索结果界面，用模块化结构展示文章、项目与日志结果。',
};

export default function SearchPage() {
  return (
    <main className="flex-1">
      <SearchResultsPageView />
    </main>
  );
}
