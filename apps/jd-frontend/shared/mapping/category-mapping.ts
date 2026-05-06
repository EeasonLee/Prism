import { categoryService } from '@/features/category/category.service';

export async function resolveMagentoCategoryIdFromStrapiCategoryId(
  strapiCategoryId: number
): Promise<number | null> {
  if (!Number.isInteger(strapiCategoryId) || strapiCategoryId <= 0) {
    return null;
  }

  const rows = await categoryService.getStrapiCategoriesByIds([
    strapiCategoryId,
  ]);
  const row = rows[0];
  if (!row) return null;

  const mappedMagentoId = row.magentoCategoryId;
  if (typeof mappedMagentoId === 'number' && mappedMagentoId > 0) {
    return mappedMagentoId;
  }

  return null;
}

export async function resolveMagentoCategoryIdFromStrapiCategorySlug(
  strapiCategorySlug: string
): Promise<number | null> {
  const slug = strapiCategorySlug.trim();
  if (!slug) return null;

  const row = await categoryService.getStrapiCategoryBasicBySlug(slug);
  if (!row) return null;

  const mappedMagentoId = row.magentoCategoryId;
  if (typeof mappedMagentoId === 'number' && mappedMagentoId > 0) {
    return mappedMagentoId;
  }

  return null;
}
