import { Skeleton } from "@/components/ui/skeleton";

export default function OperatorLoading() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-44" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      {/* Quick actions */}
      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
      {/* Recent sales */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-50">
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="divide-y divide-slate-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
