export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Memuat pengaturan">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-80 rounded-md bg-muted" />
      </div>

      {/* Card skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-32 rounded-md bg-muted" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded-md bg-muted" />
          <div className="h-10 w-full rounded-lg bg-muted" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 rounded-md bg-muted" />
          <div className="h-10 w-full rounded-lg bg-muted" />
        </div>
      </div>

      {/* Card skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-40 rounded-md bg-muted" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      {/* Button skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-40 rounded-lg bg-muted" />
        <div className="h-10 w-32 rounded-lg bg-muted" />
      </div>

      <span className="sr-only">Memuat pengaturan...</span>
    </div>
  );
}

export function SettingsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-5 w-36 rounded-md bg-muted" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded-md bg-muted" />
        <div className="h-4 w-3/4 rounded-md bg-muted" />
      </div>
    </div>
  );
}
