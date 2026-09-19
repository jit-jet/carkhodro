export default function CashDiscountBadge({
  percent,
  className = '',
}: {
  percent: number;
  className?: string;
}) {
  if (percent <= 0) return null;

  return (
    <span className={`inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 ${className}`}>
      {percent.toLocaleString('fa-IR', { maximumFractionDigits: 2 })}٪ تخفیف نقدی
    </span>
  );
}
