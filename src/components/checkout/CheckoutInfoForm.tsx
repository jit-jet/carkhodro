import Link from 'next/link';
import type { CheckoutContact, ProvinceVM } from '@/src/lib/serializers';

interface Props {
  value: CheckoutContact;
  phoneNumber: string;
  provinces: ProvinceVM[];
}

export default function CheckoutInfoForm({ value, phoneNumber, provinces }: Props) {
  const province = provinces.find((item) => item.id === value.provinceId);
  const city = province?.cities.find((item) => item.id === value.cityId);

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-dark shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h2 className="font-semibold text-charcoal">اطلاعات گیرنده و آدرس</h2>
        </div>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-1 text-xs font-semibold text-accent-dark hover:underline"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          ویرایش
        </Link>
      </div>

      <div className="p-5 space-y-3 text-sm">
        <Detail label="نام و نام خانوادگی" value={`${value.firstName} ${value.lastName}`} />
        <Detail label="شماره موبایل" value={phoneNumber} ltr />
        <Detail label="استان / شهر" value={`${province?.name ?? ''}، ${city?.name ?? ''}`} />
        <Detail label="آدرس" value={value.street} />
        <Detail label="کد پستی" value={value.postalCode} ltr />
      </div>
    </section>
  );
}

function Detail({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span dir={ltr ? 'ltr' : undefined} className="font-medium text-charcoal text-left leading-6">
        {value || '—'}
      </span>
    </div>
  );
}
