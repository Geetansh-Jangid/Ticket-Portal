export default function SkeletonTable({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-3 p-4" role="status" aria-label="Loading students">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/12"></div>
          <div className="h-4 bg-gray-200 rounded w-1/12"></div>
          <div className="h-5 bg-gray-200 rounded w-8 mx-auto"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
