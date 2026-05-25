"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/src/data/mockData";

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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
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

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
            className="lg:hidden text-charcoal flex-shrink-0"
            aria-label="منو"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
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
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی قطعه، برند یا مدل خودرو..."
              className="w-full border-2 border-silver rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-gray-400 focus:border-accent focus:outline-none transition-colors pe-12"
            />
            <button
              className="absolute end-0 top-0 h-full px-3.5 text-gray-400 hover:text-accent transition-colors"
              aria-label="جستجو"
            >
              <SearchIcon />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Cart */}
            <button className="relative flex items-center gap-1.5 bg-accent hover:bg-accent-dark text-charcoal font-semibold text-sm px-3 py-2.5 rounded-xl transition-colors hidden sm:flex">
              <CartIcon />
              <span className="hidden md:inline">سبد خرید</span>
              <span className="absolute -top-1.5 -start-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                ۳
              </span>
            </button>

            {/* Cart (mobile) */}
            <button className="relative sm:hidden text-charcoal p-2">
              <CartIcon />
              <span className="absolute -top-1 -start-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                ۳
              </span>
            </button>

            {/* User */}
            <button className="flex items-center gap-1.5 border-2 border-silver hover:border-accent text-charcoal font-semibold text-sm px-3 py-2.5 rounded-xl transition-colors hidden sm:flex">
              <UserIcon />
              <span className="hidden md:inline">ورود / ثبت‌نام</span>
            </button>
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
          {/* Backdrop */}
          <div className="flex-1 bg-black/50" />

          {/* Side panel — slides in from the right (start) in RTL */}
          <div
            className="w-72 bg-white h-full shadow-xl overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-accent">
              <span className="font-bold text-charcoal">منوی اصلی</span>
              <button onClick={() => setMenuOpen(false)} className="text-charcoal">
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
        </div>
      )}
    </header>
  );
}
