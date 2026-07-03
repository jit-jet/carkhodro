import Image from 'next/image';
import type { ProductVM as Product } from '@/src/lib/serializers';
import Link from 'next/link';

interface Props {
  products: Product[];
}

function formatPrice(price: number) {
  return price.toLocaleString('fa-IR') + ' تومان';
}

export default function RelatedProducts({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-charcoal mb-4">محصولات مرتبط</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden group flex flex-col"
          >
            {/* Image */}
            <div className="relative h-36 bg-white overflow-hidden">
              <Image
                src={p.mainImage}
                alt={p.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              />
              {p.discount && (
                <span className="absolute top-2 inset-e-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                  {p.discount}٪−
                </span>
              )}
            </div>

            {/* Info */}
            <div className="px-3 py-3 flex flex-col flex-1">
              <p className="text-xs text-gray-400 mb-1">{p.brand}</p>
              <h3 className="text-sm font-semibold text-charcoal leading-5 line-clamp-2 flex-1 mb-2">
                {p.name}
              </h3>
              <div>
                {p.oldPrice && (
                  <p className="text-xs text-gray-400 line-through leading-none mb-0.5">
                    {formatPrice(p.oldPrice)}
                  </p>
                )}
                <p className={`text-sm font-bold leading-none ${p.stock > 0 ? 'text-accent-dark' : 'text-gray-400'}`}>
                  {p.stock > 0 ? formatPrice(p.price) : 'ناموجود'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
