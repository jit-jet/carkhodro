'use client';

/**
 * «تماس برای قیمت» CTA — loads shop phone once and caches it for sibling cards.
 */

import { useEffect, useState } from 'react';
import { CALL_FOR_PRICE_LABEL } from '@/src/lib/call-for-price';
import { getShopContactPhone } from '@/actions/shop-phone';

/** In-flight dedupe for sibling cards on the same page (role-aware server action). */
let phonePromise: Promise<string> | null = null;

function loadPhone(): Promise<string> {
  if (!phonePromise) {
    const request = getShopContactPhone();
    phonePromise = request;
    // Allow a fresh fetch after login/logout remounts (module cache otherwise sticks).
    void request.finally(() => {
      setTimeout(() => {
        if (phonePromise === request) phonePromise = null;
      }, 30_000);
    });
  }
  return phonePromise;
}

function toTelHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '#';
}

interface Props {
  /** Preloaded phone from a server parent — skips the client fetch when set. */
  phone?: string;
  className?: string;
  /**
   * `compact` — label + phone link (search / compare).
   * `card` — product-card block with CTA button matching add-to-cart height.
   * default — PDP / large display.
   */
  variant?: 'default' | 'compact' | 'card';
  /** @deprecated use variant="compact" */
  compact?: boolean;
}

export default function CallForPrice({
  phone: phoneProp,
  className = '',
  variant,
  compact = false,
}: Props) {
  const mode = variant ?? (compact ? 'compact' : 'default');
  const [phone, setPhone] = useState(phoneProp?.trim() ?? '');

  useEffect(() => {
    if (phoneProp?.trim()) {
      setPhone(phoneProp.trim());
      return;
    }
    let cancelled = false;
    loadPhone().then((value) => {
      if (!cancelled) setPhone(value);
    });
    return () => {
      cancelled = true;
    };
  }, [phoneProp]);

  if (mode === 'card') {
    return (
      <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
          <p className="text-[11px] font-medium text-amber-800/80 mb-0.5">قیمت اعلامی</p>
          <p className="text-sm font-bold text-charcoal leading-none">{CALL_FOR_PRICE_LABEL}</p>
          {phone ? (
            <p dir="ltr" className="mt-1.5 text-xs font-semibold text-gray-600 tracking-wide">
              {phone}
            </p>
          ) : null}
        </div>
        {phone ? (
          <a
            href={toTelHref(phone)}
            className="w-full inline-flex items-center justify-center gap-2 bg-charcoal hover:bg-gray-800 active:scale-95 text-white font-semibold text-sm py-2 rounded-xl transition-all duration-150"
          >
            <PhoneIcon className="w-4 h-4" />
            تماس بگیرید
          </a>
        ) : (
          <span className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-semibold text-sm py-2 rounded-xl">
            <PhoneIcon className="w-4 h-4" />
            در حال بارگذاری…
          </span>
        )}
      </div>
    );
  }

  if (mode === 'compact') {
    return (
      <div className={className}>
        <p className="text-sm font-bold text-accent-dark leading-none">{CALL_FOR_PRICE_LABEL}</p>
        {phone ? (
          <a
            href={toTelHref(phone)}
            dir="ltr"
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-charcoal hover:text-accent-dark transition-colors"
          >
            <PhoneIcon className="w-3 h-3" />
            {phone}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      <p className="text-2xl font-bold text-accent-dark">{CALL_FOR_PRICE_LABEL}</p>
      {phone ? (
        <a
          href={toTelHref(phone)}
          dir="ltr"
          className="inline-flex items-center gap-2 text-base font-semibold text-charcoal hover:text-accent-dark transition-colors"
        >
          <PhoneIcon className="w-5 h-5" />
          {phone}
        </a>
      ) : (
        <p className="text-sm text-gray-500">برای اطلاع از قیمت با فروشگاه تماس بگیرید.</p>
      )}
    </div>
  );
}

function PhoneIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}
