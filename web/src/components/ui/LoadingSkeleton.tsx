export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
          <div className="h-3 bg-gray-100 rounded w-full mb-2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="card p-0 overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-100 border-b" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 border-b border-gray-50 px-4 flex items-center gap-4">
          <div className="h-3 bg-gray-200 rounded flex-1" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}
