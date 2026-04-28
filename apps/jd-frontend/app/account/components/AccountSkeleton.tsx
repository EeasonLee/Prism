export function AccountSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-surface" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-xl border border-border bg-background p-3">
          <nav className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-full animate-pulse rounded-lg bg-surface"
              />
            ))}
          </nav>
          <div className="mt-3 h-9 w-full animate-pulse rounded-lg bg-surface" />
        </aside>

        <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
          <div className="space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded-lg bg-surface" />
            <div className="h-4 w-full animate-pulse rounded-lg bg-surface" />
            <div className="h-4 w-5/6 animate-pulse rounded-lg bg-surface" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-32 animate-pulse rounded-lg bg-surface" />
              <div className="h-32 animate-pulse rounded-lg bg-surface" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
