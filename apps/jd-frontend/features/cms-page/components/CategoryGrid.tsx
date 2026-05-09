import type { CategoryGridProps } from '../types';
import type { ProductCardItem } from '@/features/product';
import { productQueryFacade } from '@/features/product';
import { CategoryGridClient } from './CategoryGridClient';

/**
 * CategoryGrid 服务端组件
 *
 * 在服务端预取第一个分类的商品数据，首屏直接渲染商品而不闪 loading。
 * 后续切换分类时由 CategoryGridClient 客户端 fetch。
 */
export async function CategoryGrid({ title, categories }: CategoryGridProps) {
  let initialProducts: ProductCardItem[] = [];
  let initialCategoryId = '';

  if (categories.length > 0) {
    const firstCategory = categories[0];
    initialCategoryId = String(firstCategory.id);

    try {
      const query: {
        magentoCategoryId?: number;
        strapiCategorySlug?: string;
        strapiCategoryId?: number;
        pageSize: number;
      } = { pageSize: 4 };

      if (typeof firstCategory.magentoCategoryId === 'number') {
        query.magentoCategoryId = firstCategory.magentoCategoryId;
      } else if (firstCategory.slug) {
        query.strapiCategorySlug = firstCategory.slug;
      } else {
        query.strapiCategoryId = firstCategory.id;
      }

      const result = await productQueryFacade.queryProducts(query);
      initialProducts = result.items ?? [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[CategoryGrid] Failed to pre-fetch products for category "${firstCategory.label}": ${message}`
      );
      // 失败时 fallback 到客户端 fetch，不阻塞渲染
    }
  }

  return (
    <CategoryGridClient
      title={title}
      categories={categories}
      initialProducts={initialProducts}
      initialCategoryId={initialCategoryId}
    />
  );
}
