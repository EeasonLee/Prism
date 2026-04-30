import type { PageLayoutPreset, PageTemplate } from './cms-page.types';

const PRESETS: readonly PageLayoutPreset[] = [
  'default',
  'narrow',
  'wide',
  'full',
];

const PAGE_TEMPLATES: readonly PageTemplate[] = ['default', 'category'];

/** 将 Strapi 返回值规范为合法的页面布局预设，非法值回退 default */
export function normalizePageLayoutPreset(value: unknown): PageLayoutPreset {
  if (typeof value !== 'string') return 'default';
  return PRESETS.includes(value as PageLayoutPreset)
    ? (value as PageLayoutPreset)
    : 'default';
}

/** 将 Strapi 返回值规范为合法的页面模板枚举，非法值回退 default */
export function normalizePageTemplate(value: unknown): PageTemplate {
  if (typeof value !== 'string') return 'default';
  return PAGE_TEMPLATES.includes(value as PageTemplate)
    ? (value as PageTemplate)
    : 'default';
}

/** 富文本与标题区域的容器类名（不含 main 外层） */
const PAGE_CONTENT_LAYOUT_CLASSES: Record<PageLayoutPreset, string> = {
  default: 'mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8',
  narrow: 'mx-auto max-w-2xl px-4 py-10 sm:px-6',
  wide: 'mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8',
  full: 'w-full',
};

export function getPageContentLayoutClass(preset: PageLayoutPreset): string {
  return PAGE_CONTENT_LAYOUT_CLASSES[preset];
}
