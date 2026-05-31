"use client";

import Image from "next/image";
import SliderWrapper from "@/src/components/ui/SliderWrapper";
import SectionTitle from "@/src/components/ui/SectionTitle";
import { spareBrands } from "@/src/data/mockData";

export default function BrandsSlider() {
  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <SectionTitle
          title="جستجو بر اساس برند"
          subtitle="برند خودرو خود را انتخاب کنید"
          linkHref="/brands"
          linkLabel="همه برندها"
        />

        <SliderWrapper>
          {spareBrands.map((brand) => (
            <a
              key={brand.id}
              href={`/brand/${brand.id}`}
              className="flex-shrink-0 w-36 sm:w-40 bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg border border-gray-100 hover:border-accent transition-all duration-200 group flex flex-col items-center text-center"
            >
              {/* Brand logo */}
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200 bg-gray-100">
                <Image
                  src={brand.image}
                  alt={brand.name}
                  fill
                  className="object-cover"
                />
              </div>

              <h3 className="font-bold text-sm text-charcoal group-hover:text-accent-dark transition-colors">
                {brand.name}
              </h3>

              <div className="mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-accent/20 text-accent-dark">
                {brand.count.toLocaleString("fa-IR")} قطعه
              </div>
            </a>
          ))}
        </SliderWrapper>
      </div>
    </section>
  );
}
