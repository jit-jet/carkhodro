import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProductById, getRelatedProducts, withViewerPricing, withViewerProduct } from '@/actions/products';
import { getProductReviews } from '@/actions/reviews';
import ImageGallery    from '@/src/components/pdp/ImageGallery';
import CartActions     from '@/src/components/pdp/CartActions';
import ProductComments from '@/src/components/pdp/ProductComments';
import RelatedProducts from '@/src/components/pdp/RelatedProducts';
import WishlistButton  from '@/src/components/product/WishlistButton';
import CompareButton   from '@/src/components/product/CompareButton';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return price.toLocaleString('fa-IR') + ' تومان';
}

const ORIGIN_FLAGS: Record<string, string> = {
  'آلمان':   '🇩🇪',
  'ژاپن':   '🇯🇵',
  'ایران':   '🇮🇷',
  'کره':    '🇰🇷',
  'فرانسه': '🇫🇷',
  'چین':    '🇨🇳',
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= rating ? '#F4C232' : '#E5E7EB'}
            stroke={i <= rating ? '#D89B1F' : '#D1D5DB'}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// `params` is request-time data under Cache Components. Rather than enumerate
// every id at build (which would require DB access during `next build`), the
// product detail streams inside a Suspense boundary while a skeleton ships in
// the static shell. The data itself is still cached via `getProductById`.
export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawProduct = await getProductById(id);
  if (!rawProduct) notFound();
  const product = (await withViewerProduct(rawProduct))!;

  const [relatedProducts, comments] = await Promise.all([
    withViewerPricing(await getRelatedProducts(product.id, product.categoryId)),
    getProductReviews(product.id),
  ]);
  const flag = ORIGIN_FLAGS[product.origin] ?? '🏭';

  const attrs: [string, string][] = [
    ['کد',             product.sku],
    ['تعداد در بسته',  `${product.packQuantity.toLocaleString('fa-IR')} عدد`],
    ['تعداد در کارتن', `${product.cartonQuantity.toLocaleString('fa-IR')} عدد`],
    ['دسته‌های کالا',  product.categoryLabel],
    ['نام برند',       product.brand],
    ['مدل خودرو',      product.carType],
    ['اصلی',           product.isOriginal ? 'بله' : 'خیر'],
    ['کشور سازنده',    `${flag} ${product.origin}`],
  ];

  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">

      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap" aria-label="breadcrumb">
            <a href="/"         className="hover:text-accent transition-colors">خانه</a>
            <span className="text-gray-300">/</span>
            <a href="/products" className="hover:text-accent transition-colors">محصولات</a>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Top: gallery + info ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Image gallery */}
          <ImageGallery
            images={product.images}
            name={product.name}
          />

          {/* Product info card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

            {/* Category tag */}
            <span className="inline-block bg-silver-light text-gray-500 text-xs font-medium px-3 py-1 rounded-full">
              {product.categoryLabel}
            </span>

            {/* Title */}
            <h1 className="text-xl lg:text-2xl font-bold text-charcoal leading-8">
              {product.name}
            </h1>

            {/* Rating + review count */}
            <div className="flex items-center gap-3">
              <StarDisplay rating={Math.round(product.rating)} />
              <span className="text-sm font-semibold text-charcoal">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">
                ({product.reviewCount.toLocaleString('fa-IR')} نظر)
              </span>
              <span className="text-gray-200">|</span>
              <span className="text-sm text-gray-400">
                {product.salesCount.toLocaleString('fa-IR')} فروش
              </span>
            </div>

            {/* Price box */}
            <div className="bg-silver-light rounded-xl px-5 py-4">
              {product.oldPrice && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                  {product.discount && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {product.discount}٪ تخفیف
                    </span>
                  )}
                </div>
              )}
              <p className="text-2xl font-bold text-accent-dark">
                {formatPrice(product.price)}
              </p>
            </div>

            {/* Attributes table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {attrs.map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                      <td className="px-4 py-2.5 text-gray-500 font-medium border-b border-gray-100 w-36 whitespace-nowrap">
                        {label}
                      </td>
                      <td className="px-4 py-2.5 text-charcoal border-b border-gray-100">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cart actions */}
            <CartActions product={product} />

            {/* Wishlist + Compare */}
            <div className="flex items-center gap-3">
              <WishlistButton productId={product.id} productName={product.name} variant="full" />
              <CompareButton productId={product.id} productName={product.name} variant="full" />
            </div>

          </div>
        </div>

        {/* ── Description + Comments tabs ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ProductComments
            description={product.description}
            comments={comments}
            productId={product.id}
          />
        </div>

        {/* ── Related products ────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <RelatedProducts products={relatedProducts} />
        )}

      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100 h-12" />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="h-[420px] bg-white rounded-2xl border border-gray-100" />
          <div className="h-[420px] bg-white rounded-2xl border border-gray-100" />
        </div>
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
      </div>
    </div>
  );
}
