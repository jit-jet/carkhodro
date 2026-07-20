/**
 * Storefront shell — header + footer chrome for every public-facing route.
 * ─────────────────────────────────────────────────────────────────────────
 * Split out of the root layout so `/admin/*` (a sibling, ungrouped route) can
 * render with its own chrome instead of the storefront header/footer. Route
 * groups like `(site)` add a nested layout without affecting the URL, so every
 * page that used to live directly under `app/` keeps the exact same path.
 */

import { Suspense } from "react";
import SiteHeader from "@/src/components/layout/SiteHeader";
import HeaderFallback from "@/src/components/layout/HeaderFallback";
import SiteFooter from "@/src/components/layout/SiteFooter";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col flex-1">
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
