'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useRef } from 'react';

export default function BlogSearch({ defaultValue }: { defaultValue: string }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const inputRef     = useRef<HTMLInputElement>(null);

  const navigate = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');
      if (q.trim()) {
        params.set('q', q.trim());
      } else {
        params.delete('q');
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(inputRef.current?.value ?? '');
  };

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = '';
    navigate('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="جستجو در مقالات..."
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        {defaultValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal transition-colors"
            aria-label="پاک کردن جستجو"
          >
            ×
          </button>
        )}
      </div>
      <button
        type="submit"
        className="bg-accent hover:bg-accent-dark text-charcoal font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
      >
        جستجو
      </button>
    </form>
  );
}
