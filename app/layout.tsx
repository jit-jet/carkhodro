import type { Metadata } from "next";
import "./globals.css";
import Toaster from "@/src/components/ui/Toaster";
import SiteAnalytics from "@/src/components/layout/SiteAnalytics";
import { getPublicSiteSettings } from "@/actions/site-settings";
import { buildRootMetadata } from "@/src/lib/site-branding";
import JsonLd from "@/src/components/seo/JsonLd";
import { siteUrl } from "@/src/lib/seo";

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
        <JsonLd data={[
          { '@context': 'https://schema.org', '@type': 'Organization', name: settings.siteName, url: siteUrl('/'), logo: settings.logoUrl ? siteUrl(settings.logoUrl) : undefined },
          { '@context': 'https://schema.org', '@type': 'WebSite', name: settings.siteName, url: siteUrl('/'), potentialAction: { '@type': 'SearchAction', target: `${siteUrl('/products')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
        ]} />
        {children}
        {/* Global toast viewport — driven by the cart UI store. */}
        <Toaster />
        <SiteAnalytics
          analyticsId={settings.googleAnalyticsId || settings.analyticsId}
          tagManagerId={settings.googleTagManagerId}
        />
      </body>
    </html>
  );
}
