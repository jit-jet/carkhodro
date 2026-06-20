'use client';

/** Triggers the browser print dialog (used to "download" the invoice as PDF). */
export default function PrintButton({ label = 'چاپ فاکتور' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 bg-charcoal hover:bg-charcoal/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      {label}
    </button>
  );
}
