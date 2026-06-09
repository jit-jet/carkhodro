"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { NavLinkVM, ProductVM } from "@/src/lib/serializers";
import { getCartCount } from "@/actions/cart";
import { searchProducts } from "@/actions/search";
import { useCartUI } from "@/src/store/cart-ui";
import { useListsUI, ensureListsHydrated } from "@/src/store/lists-ui";

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.66a16 16 0 006.25 6.25l1.18-1.18a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v4h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4.5 h-4.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

function HeartOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function CompareBarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <path d="M9 3v18M15 3v18" />
      <path d="M9 7l-4 4 4 4M15 7l4 4-4 4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function NavBadge({ count, color }: { count: number; color: "red" | "blue" }) {
  if (count <= 0) return null;
  return (
    <span
      className={[
        "absolute -top-1.5 -inset-e-1.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center text-white text-[9px] font-bold rounded-full tabular-nums leading-none",
        color === "red" ? "bg-red-500" : "bg-blue-600",
      ].join(" ")}
    >
      {count.toLocaleString("fa-IR")}
    </span>
  );
}

function CartBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-2 -inset-e-2 min-w-5 h-5 px-1 flex items-center justify-center bg-charcoal text-white text-[10px] font-bold rounded-full tabular-nums ring-2 ring-white">
      {count.toLocaleString("fa-IR")}
    </span>
  );
}

function SearchDropdown({
  value,
  searching,
  results,
  open,
  onResultClick,
  onSeeAll,
}: {
  value: string;
  searching: boolean;
  results: ProductVM[];
  open: boolean;
  onResultClick: (id: string) => void;
  onSeeAll: () => void;
}) {
  if (!open || value.trim().length < 2) return null;
  return (
    <div className="absolute top-full inset-x-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
      {searching ? (
        <p className="px-4 py-6 text-center text-sm text-gray-400">در حال جستجو...</p>
      ) : results.length > 0 ? (
        <>
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onResultClick(p.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-silver-light transition-colors"
                >
                  <span className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-silver-light">
                    <Image src={p.mainImage} alt={p.name} fill sizes="44px" className="object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-charcoal truncate">{p.name}</span>
                    <span className="block text-xs text-gray-400 mt-0.5 truncate">{p.brand}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-charcoal whitespace-nowrap">
                    {p.price.toLocaleString("fa-IR")}{" "}
                    <span className="text-xs font-normal text-gray-400">تومان</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onSeeAll}
            className="w-full px-4 py-3 text-center text-sm font-semibold text-accent-dark hover:bg-amber-50 border-t border-gray-100 transition-colors"
          >
            مشاهده همه نتایج
          </button>
        </>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-gray-400">نتیجه‌ای یافت نشد</p>
      )}
    </div>
  );
}

export default function Header({
  navLinks,
  account,
  mobileMenuAccount,
}: {
  navLinks: NavLinkVM[];
  account: React.ReactNode;
  mobileMenuAccount?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ProductVM[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDesktopRef = useRef<HTMLDivElement>(null);
  const searchMobileRef = useRef<HTMLDivElement>(null);

  const cartCount = useCartUI((s) => s.count);
  const setCount = useCartUI((s) => s.setCount);
  const wishlistCount = useListsUI((s) => s.wishlist.size);
  const compareCount = useListsUI((s) => s.compare.size);

  useEffect(() => {
    let active = true;
    getCartCount().then((n) => active && setCount(n));
    ensureListsHydrated();
    return () => { active = false; };
  }, [setCount]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    let active = true;
    const timer = setTimeout(async () => {
      const found = await searchProducts(q);
      if (!active) return;
      setResults(found);
      setSearching(false);
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [searchQuery]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!searchDesktopRef.current?.contains(t) && !searchMobileRef.current?.contains(t)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
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

  const dropdownProps = {
    value: searchQuery,
    searching,
    results,
    open: searchOpen,
    onResultClick: goToProduct,
    onSeeAll: () => handleSearch(),
  };

  const searchInput = (isMobile: boolean) => (
    <form onSubmit={handleSearch}>
      <div className={[
        "flex items-center border-2 border-silver rounded-xl overflow-hidden transition-all",
        "focus-within:border-accent focus-within:shadow-md focus-within:bg-white bg-gray-50",
      ].join(" ")}>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          placeholder="جستجوی قطعه، برند یا مدل خودرو..."
          className={[
            "flex-1 px-5 text-sm bg-transparent outline-none placeholder-gray-400 text-charcoal",
            isMobile ? "h-10" : "h-11",
          ].join(" ")}
          role="combobox"
          aria-expanded={searchOpen && searchQuery.trim().length >= 2}
          aria-autocomplete="list"
        />
        <button
          type="submit"
          className={[
            "shrink-0 bg-accent hover:bg-accent-dark text-charcoal transition-colors flex items-center gap-1.5 font-semibold",
            isMobile ? "h-10 px-4 text-sm" : "h-11 px-5 text-sm",
          ].join(" ")}
          aria-label="جستجو"
        >
          <SearchIcon />
          {!isMobile && <span className="hidden xl:inline">جستجو</span>}
        </button>
      </div>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 w-full">

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="bg-charcoal text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-white/90">
              <PhoneIcon />
              <span>۰۲۱-۸۸۱۲۳۴۵۶</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-white/70 border-s border-white/20 ps-4">
              <MapPinIcon />
              <span>تهران، خیابان ولیعصر</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/70">
            <span className="hidden sm:flex items-center gap-1.5">
              <ShieldCheckIcon />
              <span>ضمانت اصالت کالا</span>
            </span>
            <span className="flex items-center gap-1.5">
              <TruckIcon />
              <span>ارسال سریع به سراسر کشور</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Main header ────────────────────────────────────── */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">

          {/* Icon row */}
          <div className="flex items-center gap-2 sm:gap-4 h-16">

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-charcoal hover:bg-silver-light active:scale-95 transition-all shrink-0"
              aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-haspopup="dialog"
            >
              <span className={`transition-transform duration-200 ${menuOpen ? "rotate-90" : "rotate-0"}`}>
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </span>
            </button>

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <div className="relative w-32 h-10 sm:w-40 sm:h-12">
                <Image src="/logo.png" alt="کارخودرو" fill className="object-contain" priority />
              </div>
            </Link>

            {/* Desktop search — inline in the icon row */}
            <div ref={searchDesktopRef} className="hidden lg:block flex-1 relative">
              {searchInput(false)}
              <SearchDropdown {...dropdownProps} />
            </div>

            {/* Spacer (mobile only) */}
            <div className="flex-1 lg:hidden" />

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

              {/* Wishlist — lg+ */}
              <Link
                href="/wishlist"
                aria-label="علاقه‌مندی‌ها"
                title="علاقه‌مندی‌ها"
                className="hidden lg:flex relative items-center gap-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 px-2.5 py-2 rounded-xl transition-colors group"
              >
                <HeartOutlineIcon />
                <span className="text-sm text-charcoal group-hover:text-red-500 transition-colors">علاقه‌مندی‌ها</span>
                <NavBadge count={wishlistCount} color="red" />
              </Link>

              {/* Compare — lg+ */}
              <Link
                href="/compare"
                aria-label="مقایسه"
                title="مقایسه"
                className="hidden lg:flex relative items-center gap-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-2 rounded-xl transition-colors group"
              >
                <CompareBarIcon />
                <span className="text-sm text-charcoal group-hover:text-blue-600 transition-colors">مقایسه</span>
                <NavBadge count={compareCount} color="blue" />
              </Link>

              <span className="hidden lg:block w-px h-6 bg-gray-200 mx-1" />

              {/* Cart */}
              <Link
                href="/cart"
                aria-label="سبد خرید"
                className="relative flex items-center gap-1.5 bg-accent hover:bg-accent-dark active:scale-95 text-charcoal font-semibold text-sm px-3 py-2.5 rounded-xl transition-all"
              >
                <CartIcon />
                <span className="hidden sm:inline">سبد خرید</span>
                <CartBadge count={cartCount} />
              </Link>

              {/* Account */}
              {account}
            </div>
          </div>

          {/* Mobile search row */}
          <div ref={searchMobileRef} className="lg:hidden pb-3 relative">
            {searchInput(true)}
            <SearchDropdown {...dropdownProps} />
          </div>

        </div>
      </div>

      {/* ── Desktop nav ────────────────────────────────────── */}
      <nav className="bg-accent hidden lg:block shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={[
                      "relative block px-5 py-3.5 text-charcoal font-semibold text-sm transition-colors",
                      active ? "bg-black/10" : "hover:bg-black/5",
                    ].join(" ")}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 inset-x-0 h-0.5 bg-charcoal/60 rounded-t" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── Mobile menu overlay ─────────────────────────────── */}
      <div
        className={[
          "lg:hidden fixed inset-0 z-40 flex transition-[opacity,visibility] duration-300",
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible",
        ].join(" ")}
        onClick={() => setMenuOpen(false)}
      >
        {/* Slide-in panel (RTL: sits on the right edge) */}
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="منوی اصلی"
          className={[
            "w-72 bg-white h-full shadow-2xl overflow-y-auto flex flex-col",
            "transition-transform duration-300 ease-out",
            menuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-accent shrink-0">
            <div className="relative w-28 h-9">
              <Image src="/logo.png" alt="کارخودرو" fill className="object-contain" />
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 text-charcoal transition-colors"
              aria-label="بستن منو"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="py-1">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={[
                        "flex items-center px-5 py-4 font-medium text-sm border-b border-gray-50 transition-colors",
                        active
                          ? "bg-amber-50 text-accent-dark font-semibold"
                          : "text-charcoal hover:bg-silver-light hover:text-accent-dark",
                      ].join(" ")}
                    >
                      {active && <span className="w-1 h-4 bg-accent-dark rounded-full me-2.5 shrink-0" />}
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Account (logout when signed in) */}
            {mobileMenuAccount}

            {/* Wishlist & Compare */}
            <div className="border-t-4 border-silver-light mt-1">
              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-5 py-4 text-charcoal font-medium text-sm hover:bg-red-50 hover:text-red-500 border-b border-gray-50 transition-colors"
              >
                <span className="relative shrink-0 text-gray-400">
                  <HeartOutlineIcon />
                  <NavBadge count={wishlistCount} color="red" />
                </span>
                علاقه‌مندی‌ها
                {wishlistCount > 0 && (
                  <span className="ms-auto text-xs font-bold text-red-500">
                    {wishlistCount.toLocaleString("fa-IR")} مورد
                  </span>
                )}
              </Link>
              <Link
                href="/compare"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-5 py-4 text-charcoal font-medium text-sm hover:bg-blue-50 hover:text-blue-600 border-b border-gray-50 transition-colors"
              >
                <span className="relative shrink-0 text-gray-400">
                  <CompareBarIcon />
                  <NavBadge count={compareCount} color="blue" />
                </span>
                لیست مقایسه
                {compareCount > 0 && (
                  <span className="ms-auto text-xs font-bold text-blue-600">
                    {compareCount.toLocaleString("fa-IR")} مورد
                  </span>
                )}
              </Link>
            </div>
          </nav>

          {/* Bottom contact info */}
          <div className="p-4 bg-charcoal text-white text-sm space-y-3 shrink-0">
            <a href="tel:02188123456" className="flex items-center gap-2.5 hover:text-accent transition-colors">
              <PhoneIcon />
              <span>۰۲۱-۸۸۱۲۳۴۵۶</span>
            </a>
            <div className="flex items-center gap-2.5 text-white/70">
              <MapPinIcon />
              <span>تهران، خیابان ولیعصر</span>
            </div>
          </div>
        </div>

        {/* Backdrop */}
        <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      </div>

    </header>
  );
}
