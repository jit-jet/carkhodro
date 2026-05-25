import HeroBanner from "@/src/components/home/HeroBanner";
import CarModelsSlider from "@/src/components/home/CarModelsSlider";
import BrandsSlider from "@/src/components/home/BrandsSlider";
import NewArrivalsSlider from "@/src/components/home/NewArrivalsSlider";
import SpecialOffersSlider from "@/src/components/home/SpecialOffersSlider";
import CategoriesSlider from "@/src/components/home/CategoriesSlider";

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CarModelsSlider />
      <BrandsSlider />
      <NewArrivalsSlider />
      <SpecialOffersSlider />
      <CategoriesSlider />
    </>
  );
}
