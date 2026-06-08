function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

interface Props {
  subtotal: number;
  /** `null` until the user picks a shipping method (cart → checkout handoff). */
  shippingCost: number | null;
  /** VAT / fees. Omit or 0 to hide the row. */
  taxAmount?: number;
  total: number;
  itemCount: number;
  /** CTA label, e.g. "ادامه و تسویه حساب" (cart) or "ثبت و پرداخت سفارش" (checkout). */
  ctaLabel: string;
  onPlaceOrder: () => void;
  disabled?: boolean;
  busy?: boolean;
}

export default function OrderSummary({
  subtotal,
  shippingCost,
  taxAmount = 0,
  total,
  itemCount,
  ctaLabel,
  onPlaceOrder,
  disabled = false,
  busy = false,
}: Props) {
  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-accent-dark shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        <h2 className="font-semibold text-charcoal">خلاصه سفارش</h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Line items */}
        <div className="space-y-3">
          <Row
            label={`جمع محصولات (${itemCount.toLocaleString('fa-IR')} مورد)`}
            value={formatPrice(subtotal)}
          />
          <Row
            label="هزینه ارسال"
            value={
              shippingCost === null
                ? 'در مرحله بعد محاسبه می‌شود'
                : shippingCost === 0
                  ? 'رایگان'
                  : formatPrice(shippingCost)
            }
            muted={shippingCost === null}
          />
          {taxAmount > 0 && (
            <Row label="مالیات بر ارزش افزوده" value={formatPrice(taxAmount)} />
          )}
        </div>

        {/* Divider + total */}
        <div className="border-t border-dashed border-gray-200 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-charcoal text-base">مبلغ قابل پرداخت</span>
            <span className="text-xl font-extrabold text-accent-dark tabular-nums">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onPlaceOrder}
          disabled={disabled || busy}
          className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-charcoal font-bold text-base py-3.5 rounded-xl transition-all duration-150 shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {busy && (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          )}
          {ctaLabel}
        </button>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <svg
            className="w-4 h-4 text-green-500 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          پرداخت امن با رمزنگاری SSL
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={muted ? 'text-xs text-gray-400' : 'font-medium text-charcoal'}>
        {value}
      </span>
    </div>
  );
}
