/** Static footer shell shown while session-aware SiteFooter streams in. */
export default function FooterFallback() {
  return (
    <footer className="bg-charcoal text-white" aria-hidden>
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="h-2.5 w-16 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-40 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
