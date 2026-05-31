function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

interface Row {
  label: string;
  value: number;
  highlight?: boolean;
}

interface Props {
  subtotal: number;
  shippingCost: number;
  total: number;
  itemCount: number;
  onPlaceOrder: () => void;
}

export default function OrderSummary({
  subtotal,
  shippingCost,
  total,
  itemCount,
  onPlaceOrder,
}: Props) {
  const rows: Row[] = [
    { label: `جمع محصولات (${itemCount.toLocaleString('fa-IR')} مورد)`, value: subtotal },
    { label: 'هزینه ارسال', value: shippingCost },
  ];

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
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-medium text-charcoal">{formatPrice(row.value)}</span>
            </div>
          ))}
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
          className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-charcoal font-bold text-base py-3.5 rounded-xl transition-all duration-150 shadow hover:shadow-md"
        >
          ثبت و پرداخت سفارش
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
