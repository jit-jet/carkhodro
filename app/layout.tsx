import type { Metadata } from "next";
import "./globals.css";
import Toaster from "@/src/components/ui/Toaster";

export const metadata: Metadata = {
  title: "کارخودرو | فروشگاه قطعات یدکی خودرو",
  description: "خرید آنلاین قطعات یدکی خودروهای ایرانی و خارجی با بهترین قیمت و ضمانت اصالت کالا",
};

/**
 * True App Router root — just `<html>`/`<body>`, fonts and the global toast
 * viewport. Storefront chrome (header/footer) lives in `app/(site)/layout.tsx`;
 * `/admin/*` gets its own chrome instead. Keeping this shell free of any
 * route-specific UI is what lets both sub-trees coexist under one root layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-white text-charcoal font-sans antialiased flex flex-col">
        {children}
        {/* Global toast viewport — driven by the cart UI store. */}
        <Toaster />
      </body>
    </html>
  );
}
