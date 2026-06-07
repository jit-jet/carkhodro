import type { Metadata } from "next";
import "./globals.css";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { getNavLinks } from "@/actions/navigation";

export const metadata: Metadata = {
  title: "کارخودرو | فروشگاه قطعات یدکی خودرو",
  description: "خرید آنلاین قطعات یدکی خودروهای ایرانی و خارجی با بهترین قیمت و ضمانت اصالت کالا",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navLinks = await getNavLinks();

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
        <Header navLinks={navLinks} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
