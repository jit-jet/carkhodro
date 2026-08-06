import type { Metadata } from "next";
import "./globals.css";
import Toaster from "@/src/components/ui/Toaster";
import SiteAnalytics from "@/src/components/layout/SiteAnalytics";
import { getPublicSiteSettings } from "@/actions/site-settings";
import { buildRootMetadata } from "@/src/lib/site-branding";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return buildRootMetadata(settings);
}

/**
 * True App Router root — just `<html>`/`<body>`, fonts and the global toast
 * viewport. Storefront chrome (header/footer) lives in `app/(site)/layout.tsx`;
 * `/admin/*` gets its own chrome instead. Keeping this shell free of any
 * route-specific UI is what lets both sub-trees coexist under one root layout.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSiteSettings();

  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-white text-charcoal font-sans antialiased flex flex-col">
        {children}
        {/* Global toast viewport — driven by the cart UI store. */}
        <Toaster />
        <SiteAnalytics analyticsId={settings.analyticsId} />
      </body>
    </html>
  );
}
