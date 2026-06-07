import SliderWrapper from "@/src/components/ui/SliderWrapper";
import SectionTitle from "@/src/components/ui/SectionTitle";
import ProductCard from "@/src/components/ui/ProductCard";
import { getSpecialOffers } from "@/actions/products";

export default async function SpecialOffersSlider() {
  const offerProducts = await getSpecialOffers();
  return (
    <section className="py-10 bg-white relative overflow-hidden">
      {/* Subtle background decoration */}
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
