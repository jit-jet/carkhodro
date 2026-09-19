'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MobileNavItemVM } from '@/actions/mobile-nav';

export default function MobileNav({ items }: { items: MobileNavItemVM[] }) {
  const pathname = usePathname();
  const hiddenRoute = pathname === '/login' || pathname === '/signup' ||
    pathname === '/admin' || pathname.startsWith('/admin/');
  const visible = items.filter((item) => item.isActive && item.href && item.label && item.iconUrl);
  if (hiddenRoute || visible.length === 0) return null;

  return (
    <>
      <div aria-hidden="true" className="h-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:hidden" />
      <nav aria-label="منوی پایین موبایل" className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex min-h-[4.25rem] items-stretch overflow-x-auto px-1 pb-[env(safe-area-inset-bottom,0px)] [scrollbar-width:none]">
          {visible.map((item) => {
            const targetPath = item.href.split('?')[0];
            const active = pathname === targetPath || (targetPath !== '/' && pathname.startsWith(targetPath + '/'));
            return (
              <Link key={item.id} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold transition-colors ${active ? 'text-accent-dark' : 'text-charcoal hover:text-accent-dark'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.iconUrl} alt="" className="h-6 w-6 object-contain" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
