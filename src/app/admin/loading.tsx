import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <Skeleton className="w-11 h-11 rounded-xl" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3 w-48 mb-4" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3 w-32 mb-4" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100">
            <div className="px-5 py-4 border-b border-slate-50 space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex gap-4 px-5 py-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
