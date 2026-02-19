function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-default-200 ${className}`}
    />
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <SkeletonBox className={`h-4 ${className}`} />;
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="flex gap-4 border-b border-default-200 pb-2 mb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 border-b border-default-100 py-3"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonBox
              key={colIdx}
              className={`h-4 flex-1 ${colIdx === 0 ? "max-w-[140px]" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-default-200 p-4">
      <SkeletonBox className="h-4 w-1/2 mb-3" />
      <SkeletonBox className="h-8 w-1/3 mb-2" />
      <SkeletonBox className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <SkeletonBox className="h-8 w-48" />
      {/* Info card */}
      <div className="rounded-xl border border-default-200 p-6 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <SkeletonBox className="h-4 w-28 shrink-0" />
            <SkeletonBox className="h-4 flex-1 max-w-xs" />
          </div>
        ))}
      </div>
      {/* Second section */}
      <SkeletonBox className="h-6 w-32" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
