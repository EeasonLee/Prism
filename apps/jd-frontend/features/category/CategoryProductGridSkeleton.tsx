import { ProductCardSkeleton } from '@/features/product/ProductCardSkeleton';

interface CategoryProductGridSkeletonProps {
  count?: number;
}

export function CategoryProductGridSkeleton({
  count = 8,
}: CategoryProductGridSkeletonProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
