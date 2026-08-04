import HeroBanner from "@/src/components/home/HeroBanner";
import CarModelsSlider from "@/src/components/home/CarModelsSlider";
import BrandsSlider from "@/src/components/home/BrandsSlider";
import NewArrivalsSlider from "@/src/components/home/NewArrivalsSlider";
import SpecialOffersSlider from "@/src/components/home/SpecialOffersSlider";
import CategoriesSlider from "@/src/components/home/CategoriesSlider";
import AnimatedSection from "@/src/components/ui/AnimatedSection";
import { getCarBrands, getCarModels, getPartsBrandsHome } from "@/actions/brands";
import { getHeroBanners, getHeroContent } from "@/actions/hero-banners";

export default async function HomePage() {
  const [spareBrands, carModels, partsBrands, heroContent, heroImages] = await Promise.all([
    getCarBrands(),
    getCarModels(),
    getPartsBrandsHome(),
    getHeroContent(),
    getHeroBanners(),
  ]);

  return (
    <>
      {/* Hero runs its own CSS entrance — no wrapper needed */}
      <HeroBanner content={heroContent} images={heroImages} />

      <AnimatedSection>
        <CarModelsSlider spareBrands={spareBrands} carModels={carModels} />
      </AnimatedSection>

      <AnimatedSection delay={60}>
        <BrandsSlider brands={partsBrands} />
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
