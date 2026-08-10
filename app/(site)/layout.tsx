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
import FooterFallback from "@/src/components/layout/FooterFallback";
import { getPublicSiteSettings } from '@/actions/site-settings';
import { ProductWatermarkProvider } from '@/src/components/product/ProductImageWatermark';

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSiteSettings();
  return (
    <ProductWatermarkProvider settings={{ url: settings.productWatermarkUrl, position: settings.productWatermarkPosition }}>
    <div className="min-h-screen flex flex-col flex-1">
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={<FooterFallback />}>
        <SiteFooter />
      </Suspense>
    </div>
    </ProductWatermarkProvider>
  );
}
