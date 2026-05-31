/**
 * AuthCard
 * Shared layout wrapper for all authentication pages (login, signup).
 * Renders a centred white card on a dark background with the site logo.
 */

import Image from 'next/image';
import Link from 'next/link';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-[calc(100vh-110px)] flex items-center justify-center bg-dark-bg px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Accent top strip */}
        <div className="h-1.5 bg-accent" />

        <div className="px-6 sm:px-10 py-8 sm:py-10">
          {/* Site logo */}
          <div className="flex justify-center mb-7">
            <Link href="/" aria-label="بازگشت به صفحه اصلی">
              <div className="relative w-36 h-12">
                <Image
                  src="/logo.png"
                  alt="کارخودرو"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Title + optional subtitle */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-charcoal">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1.5 leading-6">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
