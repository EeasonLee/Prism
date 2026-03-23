/**
 * Section 组件注册表
 *
 * 这是 CMS 页面系统的核心映射层，负责将 Strapi 的 Section 类型映射到 React 组件。
 *
 * 版本化规则：
 * - 新增能力用新 key（如 'page.hero-banner-v2'）
 * - 旧版本保持冻结，仅修 bug
 * - 禁止破坏性修改现有 Section
 *
 * 使用示例：
 * ```typescript
 * import { renderSections } from './blockMap';
 *
 * export default function Page({ sections }) {
 *   return <main>{renderSections(sections)}</main>;
 * }
 * ```
 */

import type { ComponentType } from 'react';
import type { PageSection } from '@/lib/api/cms-page.types';
import { HeroBanner } from './HeroBanner';
import { CategoryGrid } from './CategoryGrid';
import { ProductCarousel } from './ProductCarousel';
import { ServiceBadges } from './ServiceBadges';
import { ImageTextBlock } from './ImageTextBlock';
import { FeaturedProducts } from './FeaturedProducts';
import { ContentCarousel } from './ContentCarousel';
import { VideoShowcase } from './VideoShowcase';

/**
 * Section 组件注册表
 *
 * 将 Strapi Section 类型映射到 React 组件。
 *
 * 添加新 Section 时：
 * 1. 在 Strapi 中创建新的 Component（如 page.hero-banner-v2）
 * 2. 在 cms-page.types.ts 中定义新的 Props 类型
 * 3. 创建新的 React 组件
 * 4. 在此注册表中添加映射
 */
/** 各 Section 的 props 联合类型，用于异构 block 注册表 */
type PageSectionProps = PageSection['props'];

export const blockMap = {
  'page.hero-banner': HeroBanner,
  'page.category-grid': CategoryGrid,
  'page.product-carousel': ProductCarousel,
  'page.service-badges': ServiceBadges,
  'page.image-text-block': ImageTextBlock,
  'page.featured-products': FeaturedProducts,
  'page.content-carousel': ContentCarousel,
  'page.video-showcase': VideoShowcase,
} as Record<string, ComponentType<PageSectionProps>>;

/**
 * 渲染 Section 列表
 *
 * @param sections - Page 的 sections 数组
 * @returns React 元素数组
 *
 * 设计原则：
 * - 渲染层只做映射，不做业务判断
 * - type 不存在 = 配置错误，记录警告但不中断渲染
 * - 每个 Section 独立渲染，单个失败不影响整体
 */
export function renderSections(sections: PageSection[]) {
  return sections.map((section, index) => {
    const Component = blockMap[section.__component];

    if (!Component) {
      console.warn(`Unknown section type: ${section.__component}`);
      return null;
    }

    return (
      <Component
        key={`${section.__component}-${section.id}-${index}`}
        {...section.props}
      />
    );
  });
}
