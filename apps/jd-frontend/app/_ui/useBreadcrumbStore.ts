import { create } from 'zustand';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbStoreState {
  /** 导航历史，每项含完整 URL（含 search params） */
  history: BreadcrumbItem[];
  /** 将当前页面 items + currentUrl 合并到历史 */
  track: (items: BreadcrumbItem[], currentUrl: string) => void;
}

export const useBreadcrumbStore = create<BreadcrumbStoreState>((set, get) => ({
  history: [],

  track: (items, currentUrl) => {
    const { history } = get();
    const newHistory = mergeHistory(history, items, currentUrl);
    set({ history: newHistory });
  },
}));

/**
 * 以「最长公共前缀」策略合并新旧面包屑路径。
 *
 * 公共前缀命中 → 保留历史的 href（已在历史中的链接不覆盖，防止丢失筛选参数）。
 * 超出公共前缀的历史项 → 丢弃（用户通过面包屑跳回或导航到不同分支）。
 * 当前页（最后一项）→ 使用 currentUrl 作为 href（含 search params，供后续页面的 resolveItems 回填）。
 */
function mergeHistory(
  history: BreadcrumbItem[],
  items: BreadcrumbItem[],
  currentUrl: string
): BreadcrumbItem[] {
  if (history.length === 0) {
    // 首访：把 currentUrl 赋给最后一项（当前页），以便后续页面复用
    return items.map((item, i) =>
      i === items.length - 1 ? { ...item, href: currentUrl } : item
    );
  }

  // 最长公共前缀
  let commonLen = 0;
  while (
    commonLen < history.length &&
    commonLen < items.length &&
    history[commonLen].label === items[commonLen].label
  ) {
    commonLen++;
  }

  // 公共前缀保持历史项（保留已存储的 href）
  const result: BreadcrumbItem[] = history
    .slice(0, commonLen)
    .map(h => ({ ...h }));

  // 新项追加
  for (let i = commonLen; i < items.length; i++) {
    const isLast = i === items.length - 1;
    result.push({
      label: items[i].label,
      href: isLast ? currentUrl : items[i].href,
    });
  }

  return result;
}
