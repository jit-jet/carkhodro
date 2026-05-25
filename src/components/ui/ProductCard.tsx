import type { Product } from "@/src/data/mockData";

interface ProductCardProps {
  product: Product;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-accent fill-accent' : 'text-gray-300 fill-gray-300'}`}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function formatPrice(price: number): string {
  return price.toLocaleString("fa-IR") + " تومان";
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group flex flex-col w-52 sm:w-56 flex-shrink-0">
      {/* Image placeholder */}
      <div
        className="relative h-40 flex items-center justify-center text-5xl"
        style={{ backgroundColor: product.bgColor }}
      >
        {product.discount && (
          <span className="absolute top-2 end-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {product.discount}٪ تخفیف
          </span>
        )}
        {product.isNew && !product.discount && (
          <span className="absolute top-2 end-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            جدید
          </span>
        )}
        <span className="group-hover:scale-110 transition-transform duration-200">
          {product.icon}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1">
          {product.brand} • {product.model}
        </p>
        <h3 className="text-sm font-semibold text-charcoal leading-5 mb-2 line-clamp-2 flex-1">
          {product.title}
        </h3>

        <StarRating rating={product.rating} />
        <p className="text-xs text-gray-400 mt-0.5 mb-3">
          ({product.reviewCount.toLocaleString("fa-IR")} نظر)
        </p>

        {/* Price */}
        <div className="mt-auto">
          {product.oldPrice && (
            <p className="text-xs text-gray-400 line-through mb-0.5">
              {formatPrice(product.oldPrice)}
            </p>
          )}
          <p className="text-base font-bold text-accent-dark">
            {formatPrice(product.price)}
          </p>
        </div>

        <button className="mt-3 w-full bg-accent hover:bg-accent-dark text-charcoal font-semibold text-sm py-2 rounded-xl transition-colors duration-200">
          افزودن به سبد
        </button>
      </div>
    </div>
  );
}
