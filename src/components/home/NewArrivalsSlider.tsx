import { Suspense } from 'react';
import SliderWrapper from '@/src/components/ui/SliderWrapper';
import SectionTitle from '@/src/components/ui/SectionTitle';
import ProductCard from '@/src/components/ui/ProductCard';
import { getNewArrivals, withViewerPricing } from '@/actions/products';

function SliderSkeleton() {
  return (
    <div className="py-10 bg-silver-light">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="flex gap-4 overflow-hidden py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-56 sm:w-60 h-80 shrink-0 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function NewArrivalsSliderContent() {
  const newProducts = await withViewerPricing(await getNewArrivals());
  return (
    <section className="py-10 bg-silver-light">
      <div className="max-w-7xl mx-auto px-4">
        <SectionTitle
          title="جدیدترین محصولات"
          subtitle="تازه‌وارد‌های فروشگاه کارخودرو"
          linkHref="/new-arrivals"
          linkLabel="همه محصولات جدید"
        />
        <SliderWrapper className="py-2">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </SliderWrapper>
      </div>
    </section>
  );
}

export default function NewArrivalsSlider() {
  return (
    <Suspense fallback={<SliderSkeleton />}>
      <NewArrivalsSliderContent />
    </Suspense>
  );
}
