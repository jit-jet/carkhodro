import { Suspense } from 'react';
import SliderWrapper from '@/src/components/ui/SliderWrapper';
import SectionTitle from '@/src/components/ui/SectionTitle';
import ProductCard from '@/src/components/ui/ProductCard';
import { getSpecialOffers, withViewerPricing } from '@/actions/products';

function SliderSkeleton() {
  return (
    <section className="py-10 bg-white relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent via-accent-dark to-accent" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="flex gap-4 overflow-hidden py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-56 sm:w-60 h-80 shrink-0 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

async function SpecialOffersSliderContent() {
  const offerProducts = await withViewerPricing(await getSpecialOffers());
  return (
    <section className="py-10 bg-white relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent via-accent-dark to-accent" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            🔥 تخفیف ویژه
          </span>
        </div>
        <SectionTitle
          title="پیشنهادات شگفت‌انگیز"
          subtitle="بهترین تخفیف‌ها تا پایان این هفته"
          linkHref="/offers"
          linkLabel="همه پیشنهادات"
        />
        <SliderWrapper className="py-2">
          {offerProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </SliderWrapper>
      </div>
    </section>
  );
}

export default function SpecialOffersSlider() {
  return (
    <Suspense fallback={<SliderSkeleton />}>
      <SpecialOffersSliderContent />
    </Suspense>
  );
}
