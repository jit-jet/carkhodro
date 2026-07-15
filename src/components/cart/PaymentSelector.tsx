import type { PaymentMethod } from '@/generated/prisma_client';

interface PaymentDef {
  id: PaymentMethod;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

/* Bank icon */
function BankIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="7" width="22" height="13" rx="2" />
      <path d="M16 12a4 4 0 00-8 0" />
      <path d="M1 12h22" />
    </svg>
  );
}

/* Banknote icon */
function BanknoteIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="5" width="22" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M5 12h.01M19 12h.01" />
    </svg>
  );
}

const PAYMENT_DEFS: PaymentDef[] = [
  {
    id: 'ONLINE',
    label: 'پرداخت آنلاین (درگاه بانکی)',
    hint: 'پس از ثبت سفارش به درگاه پرداخت امن بانکی هدایت می‌شوید. تمام کارت‌های شتاب پذیرفته می‌شود.',
    icon: <BankIcon />,
  },
  {
    id: 'COD',
    label: 'پرداخت در محل (نقد / کارت)',
    hint: 'مبلغ سفارش هنگام تحویل توسط پیک دریافت می‌شود. این روش فقط در محدوده تهران قابل انتخاب است.',
    icon: <BanknoteIcon />,
  },
];

interface Props {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  /** When set, only these methods are shown (defaults to all). */
  allowedMethods?: PaymentMethod[];
}

export default function PaymentSelector({ selected, onChange, allowedMethods }: Props) {
  const methods = allowedMethods ?? PAYMENT_DEFS.map((p) => p.id);
  const defs = PAYMENT_DEFS.filter((p) => methods.includes(p.id));
  const hint = defs.find((p) => p.id === selected)?.hint ?? PAYMENT_DEFS[0].hint;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        {/* Credit card icon */}
        <svg
          className="w-5 h-5 text-accent-dark shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
        <h2 className="font-semibold text-charcoal">روش پرداخت</h2>
      </div>

      <div className="p-4 space-y-3">
        {defs.map((def) => {
          const isSelected = selected === def.id;
          return (
            <label
              key={def.id}
              className={[
                'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150',
                isSelected
                  ? 'border-accent bg-amber-50'
                  : 'border-gray-100 hover:border-silver',
              ].join(' ')}
            >
              <input
                type="radio"
                name="payment"
                value={def.id}
                checked={isSelected}
                onChange={() => onChange(def.id)}
                className="w-4 h-4 accent-[#F4C232] shrink-0"
              />

              <span
                className={isSelected ? 'text-accent-dark' : 'text-gray-400'}
              >
                {def.icon}
              </span>

              <span className="text-sm font-semibold text-charcoal">{def.label}</span>
            </label>
          );
        })}

        {/* Contextual helper text */}
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-5">
          <svg
            className="w-4 h-4 mt-0.5 shrink-0 text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {hint}
        </div>
      </div>
    </section>
  );
}
