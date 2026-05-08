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
 * 合并当前页 items 到导航历史。
 *
 * 策略：按位置对齐——history 和 items 重叠的祖先位置保留 history（反映实际导航路径），
 * items 多出的部分追加。最后一项始终用 currentUrl。
 * 同名 label 的 href 优先用 history 的（保留筛选参数）。
 */
function mergeHistory(
  history: BreadcrumbItem[],
  items: BreadcrumbItem[],
  currentUrl: string
): BreadcrumbItem[] {
  if (items.length === 0) return history;
  if (history.length === 0) {
    return items.map((item, i) =>
      i === items.length - 1 ? { ...item, href: currentUrl } : item
    );
  }

  const result: BreadcrumbItem[] = [];

  // 重叠的祖先位置：优先保留 history（反映用户实际导航路径）
  const overlapEnd = Math.min(history.length, items.length - 1);
  for (let i = 0; i < overlapEnd; i++) {
    result.push({ ...history[i] });
  }

  // 新 items 多出的部分追加
  for (let i = overlapEnd; i < items.length; i++) {
    result.push({
      label: items[i].label,
      href: i === items.length - 1 ? currentUrl : items[i].href,
    });
  }

  return result;
}
