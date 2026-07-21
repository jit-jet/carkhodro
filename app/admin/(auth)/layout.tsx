/**
 * Admin login shell — no sidebar, just a centered card. Kept as its own route
 * group inside `/admin` so the auth-gated `(dashboard)` group can have a
 * completely different layout without conditional logic.
 */

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #F4C232 0%, transparent 40%), radial-gradient(circle at 80% 80%, #F4C232 0%, transparent 35%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}
