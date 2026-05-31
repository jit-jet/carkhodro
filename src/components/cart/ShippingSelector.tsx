import type { ShippingOption } from '@/src/data/cartMockData';

function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

interface Props {
  options: ShippingOption[];
  selected: string;
  onChange: (id: string) => void;
}

export default function ShippingSelector({ options, selected, onChange }: Props) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        {/* Truck icon */}
        <svg
          className="w-5 h-5 text-accent-dark shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <path d="M16 8h4l3 5v3h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <h2 className="font-semibold text-charcoal">روش ارسال</h2>
      </div>

      <div className="p-4 space-y-3">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <label
              key={opt.id}
              className={[
                'flex items-center justify-between gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150',
                isSelected
                  ? 'border-accent bg-amber-50'
                  : 'border-gray-100 hover:border-silver',
              ].join(' ')}
            >
              {/* Radio + text */}
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => onChange(opt.id)}
                  className="w-4 h-4 accent-[#F4C232]"
                />
                <div>
                  <p className="text-sm font-semibold text-charcoal">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                </div>
              </div>

              {/* Cost */}
              <span
                className={[
                  'text-sm font-bold shrink-0 transition-colors',
                  isSelected ? 'text-accent-dark' : 'text-gray-600',
                ].join(' ')}
              >
                {formatPrice(opt.cost)}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
