import SliderWrapper from "@/src/components/ui/SliderWrapper";
import SectionTitle from "@/src/components/ui/SectionTitle";
import ProductCard from "@/src/components/ui/ProductCard";
import { newProducts } from "@/src/data/mockData";

export default function NewArrivalsSlider() {
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
