/**
 * Page Loading Skeletons — shimmer placeholders shown while pages lazy-load.
 */

function ShimmerBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded ${className}`}
    />
  );
}

/** Generic page skeleton — works for most pages */
export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <ShimmerBlock className="h-8 w-48" />
        <ShimmerBlock className="h-10 w-32 rounded-md" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <ShimmerBlock className="h-4 w-20" />
            <ShimmerBlock className="h-8 w-16" />
            <ShimmerBlock className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-muted/30 p-3 flex gap-4">
          <ShimmerBlock className="h-4 w-32" />
          <ShimmerBlock className="h-4 w-24" />
          <ShimmerBlock className="h-4 w-20" />
          <ShimmerBlock className="h-4 w-28" />
          <ShimmerBlock className="h-4 w-16" />
        </div>
        {/* Table rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 flex gap-4 border-t">
            <ShimmerBlock className="h-4 w-32" />
            <ShimmerBlock className="h-4 w-24" />
            <ShimmerBlock className="h-4 w-20" />
            <ShimmerBlock className="h-4 w-28" />
            <ShimmerBlock className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Detail page skeleton (client detail, project detail) */
export function DetailPageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <ShimmerBlock className="h-8 w-8 rounded" />
        <ShimmerBlock className="h-8 w-64" />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <ShimmerBlock className="h-4 w-24" />
            <ShimmerBlock className="h-6 w-full" />
            <ShimmerBlock className="h-4 w-3/4" />
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="border rounded-lg p-6 space-y-4">
        <ShimmerBlock className="h-6 w-40" />
        <ShimmerBlock className="h-4 w-full" />
        <ShimmerBlock className="h-4 w-5/6" />
        <ShimmerBlock className="h-4 w-4/5" />
        <ShimmerBlock className="h-4 w-full" />
        <ShimmerBlock className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/** Chat/AI page skeleton */
export function ChatSkeleton() {
  return (
    <div className="p-6 flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 pb-4 border-b mb-4">
        <ShimmerBlock className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <ShimmerBlock className="h-5 w-32" />
          <ShimmerBlock className="h-3 w-20" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] space-y-2 p-3 rounded-lg ${i % 2 === 0 ? 'bg-muted/30' : 'bg-primary/5'}`}>
              <ShimmerBlock className="h-4 w-48" />
              <ShimmerBlock className="h-4 w-40" />
              {i % 2 === 0 && <ShimmerBlock className="h-4 w-32" />}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="pt-4 border-t mt-4">
        <ShimmerBlock className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default PageSkeleton;
