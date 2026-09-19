import { Suspense } from "react";
import { headers } from "next/headers";
import HeroBanner from "@/src/components/home/HeroBanner";
import CarModelsSlider from "@/src/components/home/CarModelsSlider";
import BrandsSlider from "@/src/components/home/BrandsSlider";
import NewArrivalsSlider from "@/src/components/home/NewArrivalsSlider";
import SpecialOffersSlider from "@/src/components/home/SpecialOffersSlider";
import CategoriesSlider from "@/src/components/home/CategoriesSlider";
import AndroidAppDownload from "@/src/components/home/AndroidAppDownload";
import AnimatedSection from "@/src/components/ui/AnimatedSection";
import { getCarBrands, getCarModels, getPartsBrandsHome } from "@/actions/brands";
import { getHeroBanners, getHeroContent } from "@/actions/hero-banners";
import { getCurrentUser } from "@/src/lib/session";
import { isAndroidAppUserAgent } from "@/src/lib/native-app";
import { isWholesaleUser } from "@/src/lib/user-role";

async function WholesaleAndroidAppDownload() {
  if (isAndroidAppUserAgent((await headers()).get("user-agent"))) return null;

  const user = await getCurrentUser();
  if (!isWholesaleUser(user?.role ?? null)) return null;

  return (
    <AnimatedSection delay={40}>
      <AndroidAppDownload />
    </AnimatedSection>
  );
}

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
      
      <Suspense fallback={null}>
        <WholesaleAndroidAppDownload />
      </Suspense>

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
