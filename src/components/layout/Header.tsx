"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NavLinkVM, ProductVM } from "@/src/lib/serializers";
import { getCartCount } from "@/actions/cart";
import { searchProducts } from "@/actions/search";
import { useCartUI } from "@/src/store/cart-ui";
import { useListsUI, ensureListsHydrated } from "@/src/store/lists-ui";

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.66a16 16 0 006.25 6.25l1.18-1.18a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

function HeartOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function CompareBarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 3v18M15 3v18" />
      <path d="M9 7l-4 4 4 4M15 7l4 4-4 4" />
    </svg>
  );
}

/** Coloured count bubble — hidden when count is 0. */
function NavBadge({ count, color }: { count: number; color: 'red' | 'blue' }) {
  if (count <= 0) return null;
  return (
    <span className={[
      'absolute -top-1.5 -inset-e-1.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center text-white text-[9px] font-bold rounded-full tabular-nums leading-none',
      color === 'red' ? 'bg-red-500' : 'bg-blue-600',
    ].join(' ')}>
      {count.toLocaleString('fa-IR')}
    </span>
  );
}

/** Cart item-count bubble — hidden when empty. */
function CartBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1 flex items-center justify-center bg-charcoal text-white text-[10px] font-bold rounded-full tabular-nums">
      {count.toLocaleString("fa-IR")}
    </span>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Header({
  navLinks,
  account,
  mobileMenuAccount,
}: {
  navLinks: NavLinkVM[];
  /** Server-rendered account slot (login button or user menu) — see <AccountMenu>.
   *  Auth state is owned server-side so it can't drift from access control. */
  account: React.ReactNode;
  /** Server-rendered slot for the hamburger panel: shows logout (signed-in) or
   *  nothing (guests, who already see the login button in the main header). */
  mobileMenuAccount?: React.ReactNode;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Live search state for the autocomplete dropdown
  const [results, setResults] = useState<ProductVM[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const cartCount      = useCartUI((s) => s.count);
  const setCount       = useCartUI((s) => s.setCount);
  const wishlistCount  = useListsUI((s) => s.wishlist.size);
  const compareCount   = useListsUI((s) => s.compare.size);

  useEffect(() => {
    let active = true;
    getCartCount().then((n) => active && setCount(n));
    ensureListsHydrated();
    return () => {
      active = false;
    };
  }, [setCount]);

  // Debounced live search — fires 300ms after the user stops typing.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    let active = true;
    const timer = setTimeout(async () => {
      const found = await searchProducts(q);
      if (!active) return;
      setResults(found);
      setSearching(false);
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Close the dropdown when clicking outside the search box.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setSearchOpen(false);
      router.push(`/products?q=${encodeURIComponent(q)}`);
    }
  }

  function goToProduct(id: string) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/products/${id}`);
  }

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* Top bar */}
      <div className="bg-charcoal text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <PhoneIcon />
              <span>۰۲۱-۸۸۱۲۳۴۵۶</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPinIcon />
              <span>تهران، خیابان ولیعصر، پلاک ۲۴۱</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-300">
            <span>ارسال سریع به سراسر کشور</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">ضمانت اصالت کالا</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 sm:gap-5">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-charcoal shrink-0"
            aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-haspopup="dialog"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <div className="relative w-36 h-12 sm:w-44 sm:h-14">
              <Image
                src="/logo.png"
                alt="کارخودرو"
                fill
                // sizes="50"
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Search bar */}
          <div ref={searchRef} className="flex-1 relative">
            <form onSubmit={handleSearch}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="جستجوی قطعه، برند یا مدل خودرو..."
                className="w-full border-2 border-silver rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-gray-400 focus:border-accent focus:outline-none transition-colors pe-12"
                role="combobox"
                aria-expanded={searchOpen && searchQuery.trim().length >= 2}
                aria-autocomplete="list"
              />
              <button
                type="submit"
                className="absolute inset-e-0 top-0 h-full px-3.5 text-gray-400 hover:text-accent transition-colors"
                aria-label="جستجو"
              >
                <SearchIcon />
              </button>
            </form>

            {/* Live results dropdown */}
            {searchOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full inset-x-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                {searching ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    در حال جستجو...
                  </div>
                ) : results.length > 0 ? (
                  <>
                    <ul className="max-h-96 overflow-y-auto py-1">
                      {results.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => goToProduct(p.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-start hover:bg-silver-light transition-colors"
                          >
                            <span className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-silver-light">
                              <Image src={p.mainImage} alt={p.name} fill sizes="48px" className="object-contain" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm text-charcoal truncate">{p.name}</span>
                              <span className="block text-xs text-gray-400 truncate">{p.brand}</span>
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-charcoal whitespace-nowrap">
                              {p.price.toLocaleString("fa-IR")} تومان
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="w-full px-4 py-2.5 text-center text-sm font-medium text-accent-dark hover:bg-silver-light border-t border-gray-100 transition-colors"
                    >
                      مشاهده همه نتایج
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    نتیجه‌ای یافت نشد
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Wishlist — desktop only; mobile users find it in the hamburger menu */}
            <Link
              href="/wishlist"
              aria-label="علاقه‌مندی‌ها"
              title="علاقه‌مندی‌ها"
              className="hidden lg:flex relative items-center gap-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 px-2.5 py-2 rounded-xl transition-colors"
            >
              <HeartOutlineIcon />
              <span className="text-sm font-medium text-charcoal hover:text-red-500">
                علاقه‌مندی‌ها
              </span>
              <NavBadge count={wishlistCount} color="red" />
            </Link>

            {/* Compare — desktop only */}
            <Link
              href="/compare"
              aria-label="لیست مقایسه"
              title="لیست مقایسه"
              className="hidden lg:flex relative items-center gap-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-2 rounded-xl transition-colors"
            >
              <CompareBarIcon />
              <span className="text-sm font-medium text-charcoal hover:text-blue-600">
                مقایسه
              </span>
              <NavBadge count={compareCount} color="blue" />
            </Link>

            {/* Divider — only visible when wishlist/compare are shown */}
            <span className="hidden lg:block w-px h-7 bg-gray-200 mx-1" />

            {/* Cart — sm+ */}
            <Link href="/cart" className="hidden sm:flex relative items-center gap-1.5 bg-accent hover:bg-accent-dark text-charcoal font-semibold text-sm px-3 py-2.5 rounded-xl transition-colors">
              <CartIcon />
              <span className="hidden md:inline">سبد خرید</span>
              <CartBadge count={cartCount} />
            </Link>

            {/* Cart — xs only */}
            <Link href="/cart" className="relative sm:hidden text-charcoal p-2">
              <CartIcon />
              <CartBadge count={cartCount} />
            </Link>

            {/* User — signed-in menu or login button, resolved server-side from
                the session cookie (single source of truth). See <AccountMenu>. */}
            {account}
          </div>
        </div>
      </div>

      {/* Desktop navigation */}
      <nav className="bg-accent hidden lg:block">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block px-5 py-3.5 text-charcoal font-semibold text-sm hover:bg-accent-dark transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex" onClick={() => setMenuOpen(false)}>
          {/* Side panel — first child in RTL flex = RIGHT side of screen.
              In dir="rtl" flex-row, items are ordered right→left, so putting the
              panel first keeps it pinned to the right edge as expected for Persian UIs. */}
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="منوی اصلی"
            className="w-72 bg-white h-full shadow-xl overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-accent">
              <span className="font-bold text-charcoal">منوی اصلی</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-charcoal"
                aria-label="بستن منو"
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="flex-1 py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-5 py-3.5 text-charcoal font-medium text-sm hover:bg-silver-light hover:text-accent-dark border-b border-gray-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {/* Account actions (logout) — streamed in from the server; guests see nothing */}
              {mobileMenuAccount}

              {/* Wishlist & Compare — only in hamburger on mobile */}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <Link
                  href="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 text-charcoal font-medium text-sm hover:bg-silver-light hover:text-accent-dark border-b border-gray-50 transition-colors"
                >
                  <span className="relative shrink-0">
                    <HeartOutlineIcon />
                    <NavBadge count={wishlistCount} color="red" />
                  </span>
                  علاقه‌مندی‌ها
                </Link>
                <Link
                  href="/compare"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 text-charcoal font-medium text-sm hover:bg-silver-light hover:text-accent-dark border-b border-gray-50 transition-colors"
                >
                  <span className="relative shrink-0">
                    <CompareBarIcon />
                    <NavBadge count={compareCount} color="blue" />
                  </span>
                  لیست مقایسه
                </Link>
              </div>
            </nav>

            <div className="p-4 bg-charcoal text-white text-sm space-y-2">
              <div className="flex items-center gap-2">
                <PhoneIcon />
                <span>۰۲۱-۸۸۱۲۳۴۵۶</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon />
                <span>تهران، خیابان ولیعصر</span>
              </div>
            </div>
          </div>

          {/* Backdrop — remaining space (LEFT in RTL) */}
          <div className="flex-1 bg-black/50" />
        </div>
      )}
    </header>
  );
}
