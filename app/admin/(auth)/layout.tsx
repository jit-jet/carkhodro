/**
 * Admin login shell — no sidebar, just a centered card. Kept as its own route
 * group inside `/admin` so the auth-gated `(dashboard)` group can have a
 * completely different layout without conditional logic.
 */

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-10">
      {children}
    </div>
  );
}
