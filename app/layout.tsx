import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import SiteHeader from "@/src/components/layout/SiteHeader";
import HeaderFallback from "@/src/components/layout/HeaderFallback";
import Footer from "@/src/components/layout/Footer";
import Toaster from "@/src/components/ui/Toaster";

export const metadata: Metadata = {
  title: "کارخودرو | فروشگاه قطعات یدکی خودرو",
  description: "خرید آنلاین قطعات یدکی خودروهای ایرانی و خارجی با بهترین قیمت و ضمانت اصالت کالا",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-charcoal font-sans antialiased flex flex-col">
        <Suspense fallback={<HeaderFallback />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        {/* Global toast viewport — driven by the cart UI store. */}
        <Toaster />
      </body>
    </html>
  );
}
