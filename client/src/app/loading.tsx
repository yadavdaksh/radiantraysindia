export default function Loading() {
  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-4 w-56 animate-pulse rounded-full bg-slate-200" />
        <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-[1.75rem] bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

