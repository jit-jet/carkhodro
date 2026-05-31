import HeroBanner from "@/src/components/home/HeroBanner";
import CarModelsSlider from "@/src/components/home/CarModelsSlider";
import BrandsSlider from "@/src/components/home/BrandsSlider";
import NewArrivalsSlider from "@/src/components/home/NewArrivalsSlider";
import SpecialOffersSlider from "@/src/components/home/SpecialOffersSlider";
import CategoriesSlider from "@/src/components/home/CategoriesSlider";
import AnimatedSection from "@/src/components/ui/AnimatedSection";

export default function HomePage() {
  return (
    <>
      {/* Hero runs its own CSS entrance — no wrapper needed */}
      <HeroBanner />

      <AnimatedSection>
        <CarModelsSlider />
      </AnimatedSection>

      <AnimatedSection delay={60}>
        <BrandsSlider />
      </AnimatedSection>

      <AnimatedSection delay={40}>
        <NewArrivalsSlider />
      </AnimatedSection>

      <AnimatedSection delay={40}>
        <SpecialOffersSlider />
      </AnimatedSection>

      <AnimatedSection delay={60}>
        <CategoriesSlider />
      </AnimatedSection>
    </>
  );
}
