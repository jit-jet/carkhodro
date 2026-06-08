import Image from 'next/image';
import type { CartItemVM } from '@/src/lib/serializers';

function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

interface Props {
  item: CartItemVM;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItemRow({ item, onUpdateQuantity, onRemove }: Props) {
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5">
      {/* Product image */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="96px"
          className="object-contain p-2"
        />
      </div>

      {/* Info + controls */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* SKU */}
        <span className="text-[10px] font-mono text-gray-400 tracking-wider">{item.sku}</span>

        {/* Name */}
        <h3 className="text-sm font-semibold text-charcoal leading-5 line-clamp-2">{item.name}</h3>

        {/* Unit price */}
        <p className="text-xs text-gray-500">
          قیمت واحد:{' '}
          <span className="font-semibold text-charcoal">{formatPrice(item.price)}</span>
        </p>

        {/* Bottom row: qty stepper + line total + remove */}
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {/* Quantity stepper — always LTR so +/− are on the correct sides */}
          <div
            dir="ltr"
            className="flex items-center border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => onUpdateQuantity(item.id, -1)}
              disabled={item.quantity <= 1}
              className="px-3 py-1.5 text-charcoal font-bold text-base leading-none hover:bg-silver-light disabled:opacity-30 transition-colors"
              aria-label="کاهش تعداد"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold text-charcoal select-none">
              {item.quantity.toLocaleString('fa-IR')}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, 1)}
              className="px-3 py-1.5 text-charcoal font-bold text-base leading-none hover:bg-silver-light transition-colors"
              aria-label="افزایش تعداد"
            >
              +
            </button>
          </div>

          {/* Line total */}
          <span className="text-sm font-bold text-accent-dark">{formatPrice(lineTotal)}</span>

          {/* Remove */}
          <button
            onClick={() => onRemove(item.id)}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors ms-auto"
            aria-label="حذف محصول"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}
