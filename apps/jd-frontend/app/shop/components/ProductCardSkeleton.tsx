import { Skeleton } from '@prism/ui';

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background">
      {/* Image placeholder */}
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* Info placeholder */}
      <div className="flex flex-1 flex-col px-4 pb-3 pt-3">
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-3/4" />
        <div className="mb-2 h-4" />
        <Skeleton className="mt-auto h-5 w-24" />
      </div>

      <div className="px-4 pb-4">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}
