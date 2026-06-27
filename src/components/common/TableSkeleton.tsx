import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showAvatar?: boolean;
}

/** Placeholder rows for data tables while live API loads */
export function TableSkeleton({
  rows = 6,
  columns = 6,
  showAvatar = false,
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row} className="border-b border-border last:border-0">
          {Array.from({ length: columns }).map((__, col) => (
            <td key={col} className="px-4 py-3.5 whitespace-nowrap">
              {col === 0 && showAvatar ? (
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ) : (
                <Skeleton className={cnCol(col, columns)} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function cnCol(col: number, total: number) {
  if (col === 0 && total > 1) return "h-3.5 w-24";
  if (col === total - 1) return "h-7 w-16";
  return "h-3.5 w-full max-w-[88px]";
}

interface CardGridSkeletonProps {
  count?: number;
}

export function CardGridSkeleton({ count = 6 }: CardGridSkeletonProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

interface MedCardListSkeletonProps {
  count?: number;
}

export function MedCardListSkeleton({ count = 4 }: MedCardListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full max-w-md" />
              <div className="grid grid-cols-4 gap-3">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            </div>
            <Skeleton className="h-12 w-16 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ListItemsSkeletonProps {
  count?: number;
}

export function ListItemsSkeleton({ count = 4 }: ListItemsSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
}

interface MetricCardsSkeletonProps {
  count?: number;
}

export function MetricCardsSkeleton({ count = 5 }: MetricCardsSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </>
  );
}
