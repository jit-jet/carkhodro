/** Static header shell shown while session-aware slots stream in. */
export default function HeaderFallback() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 bg-gray-100 rounded-xl animate-pulse hidden sm:block" />
          <div className="h-10 w-10 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </header>
  );
}
